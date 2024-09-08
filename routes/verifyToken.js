import pkg from 'jsonwebtoken';
const { verify } = pkg;

// Check is user is authorised
export default (req, res, next) => {
    const token = req.header('token');
    if(!token) return res.status(401).send('Access Denied')
    try {
        const verified = verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token')        
    }
}