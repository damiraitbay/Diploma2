import nodemailer from 'nodemailer';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to send email
const sendEmail = async(to, subject, text, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Generate verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email templates
const emailTemplates = {
    welcome: (name) => ({
        subject: 'Welcome to UNIHub!',
        html: `
            <h1>Welcome to UNIHub, ${name}!</h1>
            <p>We're excited to have you join our community of university students and clubs.</p>
            <p>Get started by exploring clubs and events in your area!</p>
        `
    }),

    verificationCode: (code) => ({
        subject: 'Your UNIHub Verification Code',
        html: `
            <h1>Email Verification</h1>
            <p>Your verification code is:</p>
            <h2 style="color: #4CAF50; font-size: 24px; padding: 10px; background: #f5f5f5; text-align: center;">${code}</h2>
            <p>Please use this code to verify your email address.</p>
            <p>This code will expire in 10 minutes.</p>
        `
    }),

    clubApproval: (clubName) => ({
        subject: 'Club Request Approved',
        html: `
            <h1>Your Club Request Has Been Approved!</h1>
            <p>Congratulations! Your club "${clubName}" has been approved.</p>
            <p>You can now start managing your club and creating events.</p>
        `
    }),

    eventReminder: (eventName, date, location) => ({
        subject: 'Event Reminder',
        html: `
            <h1>Upcoming Event Reminder</h1>
            <p>Don't forget about "${eventName}"!</p>
            <p>Date: ${date}</p>
            <p>Location: ${location}</p>
        `
    }),

    ticketConfirmation: (eventName, ticketId) => ({
        subject: 'Ticket Confirmation',
        html: `
            <h1>Ticket Confirmation</h1>
            <p>Your ticket for "${eventName}" has been confirmed.</p>
            <p>Ticket ID: ${ticketId}</p>
            <p>Please show this email at the event entrance.</p>
        `
    })
};

export {
    sendEmail,
    emailTemplates,
    generateVerificationCode
};