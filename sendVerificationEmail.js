import { createTransport } from 'nodemailer';

const sendVerificationEmail = async (email, verificationUrl) => {
  try {
    let transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email Address',
      text: `Please click the following link to verify your email address: ${verificationUrl}`,
      html: `<p>Please click the following link to verify your email address:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    };

    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default sendVerificationEmail;
