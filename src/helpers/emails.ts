import nodemailer from 'nodemailer';
import { email_password, email_username, sendgrid_api_key } from './constants';
// Import the SendGrid library
const sgMail = require('@sendgrid/mail');


// Setup the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: email_username,
        pass: email_password,
    },
    tls: {
        rejectUnauthorized: false, // Use with caution, especially in production
    },
});

export const admin_account_created_mail = (user: any, password: string) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Labspace</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to Labspace, ${user.first_name}!</h1>
                <p>Your admin account has been created successfully. Below are your login credentials:</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p>To log in to your account, please click the link below:</p>
                <p><a href="https://labspace-ng.vercel.app/auth/login">https://labspace-ng.vercel.app/auth/login</a></p>
                <p>We recommend changing your password immediately after logging in to ensure your account's security.</p>
                <p>For assistance, contact us at <a href="mailto:labspace-ng@gmail.com">labspace-ng@gmail.com</a>.</p>
                <p>Best regards,</p>
                <p>The Labspace Team</p>
            </div>
        </body>
        </html>
    `;
    const mailOptions = {
        from: { name: "Labspace", address: 'labspace-ng@gmail.com' },
        to: user.email,
        subject: "Labspace: Admin Account Created",
        html: htmlContent,
        text: 'Your admin account has been created.'
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

export const user_account_created_mail = (user: any, password: string) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Account Created</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to Labspace, ${user.first_name}!</h1>
                <p>Your account has been created successfully. Below are your login credentials:</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p>To log in to your account, please click the link below:</p>
                <p><a href="https://labspace-ng.vercel.app/auth/login">https://labspace-ng.vercel.app/auth/login</a></p>
                <p>We recommend changing your password immediately after logging in to ensure your account's security.</p>
                <p>For assistance, contact us at <a href="mailto:labspace-ng@gmail.com">labspace-ng@gmail.com</a>.</p>
                <p>Best regards,</p>
                <p>The Labspace Team</p>
            </div>
        </body>
        </html>
    `;
    
    const mailOptions = {
        from: { name: "Labspace", address: 'labspace-ng@gmail.com' },
        to: user.email,
        subject: "Labspace: User Account Created",
        html: htmlContent,
        text: `Your account has been created. Email: ${user.email}, Password: ${password}. Log in at: https://labspace-ng.vercel.app/auth/login`
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

export const account_suspension_mail = (user: any) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deactivated</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Account Suspended</h1>
                <p>Hello ${user.first_name},</p>
                <p>Your account has been suspended. If this was an error, please contact support at <a href="mailto:labspace-ng@gmail.com">labspace-ng@gmail.com</a>.</p>
                <p>Best regards,</p>
                <p>The Labspace Team</p>
            </div>
        </body>
        </html>
    `;
    const mailOptions = {
        from: { name: "Labspace", address: 'labspace-ng@gmail.com' },
        to: user.email,
        subject: "Labspace: Account Suspended",
        html: htmlContent,
        text: 'Your account has been suspended.'
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

export const account_reinstatement_mail = (user: any) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deactivated</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Account Reinstatement</h1>
                <p>Hello ${user.first_name},</p>
                <p>Your account has been reinstated. You can now access and use your account as usual. If you have any questions or concerns, please don't hesitate to contact our support team at <a href="mailto:labspace-ng@gmail.com">labspace-ng@gmail.com</a>.</p>
                <p>Best regards,</p>
                <p>The Labspace Team</p>
            </div>
        </body>
        </html>
    `;
    const mailOptions = {
        from: { name: "Labspace", address: 'labspace-ng@gmail.com' },
        to: user.email,
        subject: "Labspace: Account Reinstatement",
        html: htmlContent,
        text: 'Your account has been reinstated.'
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

export const admin_priviledge_removal_mail = (user: any) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deactivated</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Update to Your Account Privileges</h1>
                <p>Hello ${user.first_name},</p>
                <p>Your admin priviledges have been removed. You will no longer have access to administrative features and functions. If you have any questions or concerns, please don't hesitate to contact our support team at <a href="mailto:labspace-ng@gmail.com">labspace-ng@gmail.com</a>.</p>
                <p>Best regards,</p>
                <p>The Labspace Team</p>
            </div>
        </body>
        </html>
    `;
    const mailOptions = {
        from: { name: "Labspace", address: 'labspace-ng@gmail.com' },
        to: user.email,
        subject: "Labspace: Admin Priviledges Removal",
        html: htmlContent,
        text: 'Your admin privileges has been removed.'
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

export const admin_priviledge_reinstatemnt_mail = (user: any) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deactivated</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Update to Your Account Privileges</h1>
                <p>Hello ${user.first_name},</p>
                <p>We are pleased to inform you that you have been granted admin privileges. You now have access to administrative features and functions, and we trust that you will use these privileges responsibly. If you have any questions or concerns, please don't hesitate to contact our support team at <a href="mailto:labspace-ng@gmail.com">labspace-ng@gmail.com</a>.</p>
                <p>Best regards,</p>
                <p>The Labspace Team</p>
            </div>
        </body>
        </html>
    `;
    const mailOptions = {
        from: { name: "Labspace", address: 'labspace-ng@gmail.com' },
        to: user.email,
        subject: "Labspace: Admin Priviledges Granted",
        html: htmlContent,
        text: 'You have been granted admin privilege.'
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

export const password_reset_otp_mail = (user: any, otp: string) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset OTP</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Password Reset OTP</h1>
                <p>Hello ${user.first_name},</p>
                <p>Use the OTP below to reset your password:</p>
                <strong>${otp}</strong>
                <p>This OTP expires in 20 minutes. If you did not request this, please secure your account immediately.</p>
                <p>Best regards,</p>
                <p>The Labspace Team</p>
            </div>
        </body>
        </html>
    `;
    const mailOptions = {
        from: { name: "Labspace", address: 'labspace-ng@gmail.com' },
        to: user.email,
        subject: "Labspace: Password Reset OTP",
        html: htmlContent,
        text: 'Your password reset OTP is included in the email.'
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

export const password_reset_success_mail = (user: any) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Password Reset Successful</h1>
                <p>Hello ${user.first_name},</p>
                <p>Your password has been successfully changed. If you did not perform this action, contact support immediately.</p>
                <p>Best regards,</p>
                <p>The Labspace Team</p>
            </div>
        </body>
        </html>
    `;
    const mailOptions = {
        from: { name: "Labspace", address: 'labspace-ng@gmail.com' },
        to: user.email,
        subject: "Labspace: Password Reset Successful",
        html: htmlContent,
        text: 'Your password reset was successful.'
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
        handle_email_response(error, info, user.email);
    });
};

// Add similar templates for tasks created, assigned, and other scenarios
const handle_email_response = (error: any, info: any, email: string) => {
    if (error) {
        console.error(`Failed to send email to ${email}:`, error);
    } else {
        console.log(`Email successfully sent to ${email}:`, info.response);
    }
};


// -----------testing sendgrid emails fnction

// Set your SendGrid API Key
const SENDGRID_API_KEY = sendgrid_api_key;


// Set the API key
sgMail.setApiKey('SG.sendgrid_api_key');

// Define the email parameters
const sendEmail = async () => {
    try {
        const msg = {
            to: 'ireugbudavid@gmail.com', // Change to your recipient
            from: 'iroegbu.dg@gmail.com', // Change to your verified sender
            subject: 'Hello from SendGrid!',
            text: 'This is a plain text message.',
            html: '<strong>This is an HTML message!</strong>',
        };

        // Send the email
        const response = await sgMail.send(msg);
        console.log('Email sent successfully:', response);
    } catch (error:any) {
        console.error('Error sending email:', error.message);
        if (error.response) {
        console.error('Error details:', error.response.body);
        }
    }
};

// Call the function to send the email
// sendEmail();
