const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../index");
const User = require("../model/User");
const bcrypt = require('bcryptjs');

let server;

const testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "password123",
};

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Create a test user
const createVerifiedTestUser = async () => {
    const hashedPassword = await hashPassword("password123");
    const verifiedTestUser = new User({
        name: "Verified User",
        email: "verifiedUser@example.com",
        password: hashedPassword,
        isVerified: true,
    });
    await verifiedTestUser.save();
    return verifiedTestUser;
};

// Connecting to the database before each test
beforeEach(async () => {
    await mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true });
    server = app.listen();
});

// Cleanup test users and closing database connection and server after each test
afterEach(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
});

describe("POST /api/user/register", () => {
    it("should register a new user with test user", async () => {
        const res = await request(app)
        .post("/api/user/register")
        .send(testUser)
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.text).message).toBe('Verification email sent, please check your inbox');
    });
    
    it("should throw error with empty user data", async () => {
        const res = await request(app)
        .post("/api/user/register")
        .send({});
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('"name" is required');
    });

    it("should throw error when password is too short", async () => {
        const res = await request(app)
        .post("/api/user/register")
        .send({
            name: "Test User",
            email: "testuser@example.com",
            password: "123",
        });
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('"password" length must be at least 6 characters long');
    });

    it("should throw error when Email already exists", async () => {
        const user = new User(testUser);
        user.isVerified = true;
        await user.save();
        
        const res = await request(app)
        .post("/api/user/register")
        .send(testUser);
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('Email already exists');
    });
});

describe("GET /api/user/verify/:token", () => {
    it("should verify the user with verificationToken", async () => {
        const user = new User(testUser);
        user.verificationToken = 'dummy-token';
        await user.save();

        const res = await request(app)
        .get(`/api/user/verify/${user.verificationToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Email successfully verified');
    });
    
    it("should not verify the user with invalid token", async () => {
        const user = new User(testUser);
        user.verificationToken = 'dummy-token';
        await user.save();

        const res = await request(app)
        .get(`/api/user/verify/not-dummy-token`);
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('Invalid token');
    });
});

describe("POST /api/user/login", () => {
    it("should login with correct credentials and return token", async () => {
        await createVerifiedTestUser();
        const res = await request(app)
        .post("/api/user/login")
        .send({
            email: "verifiedUser@example.com",
            password: "password123",
        });
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.text)).toHaveProperty('token');
    });
    
    it("should not login with wrong password", async () => {
        await createVerifiedTestUser();
        const res = await request(app)
        .post("/api/user/login")
        .send({
            email: "verifiedUser@example.com",
            password: "wrong-pass",
        });
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('Password is wrong');
    });

    it("should not login to a non verified user with correct password", async () => {
        const nonVerifiedUser = await createVerifiedTestUser();
        nonVerifiedUser.isVerified = false;
        await nonVerifiedUser.save();
        const res = await request(app)
        .post("/api/user/login")
        .send({
            email: "verifiedUser@example.com",
            password: "password123",
        });
        expect(res.statusCode).toBe(400);
        expect(res.text).toBe('Please verify your email before logging in');
    });
});

describe("GET /api/user/me", () => {
    it("should return 'Access Denied' without the token", async () => {
        const res = await request(app).get("/api/user/me");
        expect(res.statusCode).toBe(401);
        expect(res.text).toBe('Access Denied');
    });

    it("should return 200 with token from /login", async () => {
        await createVerifiedTestUser();
        const loginRes = await request(app)
        .post("/api/user/login")
        .send({
            email: "verifiedUser@example.com",
            password: "password123",
        });
        const token = JSON.parse(loginRes.text).token;
        const res = await request(app)
        .get("/api/user/me")
        .set({ token: token });
        expect(res.statusCode).toBe(200);
    });
});
