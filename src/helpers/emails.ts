import { sendgrid_api_key } from "./constants"
import { readable_date } from "./date_time_elements"
import colors from 'colors'
require('colors')

const FROM_EMAIL = 'contact@ohealthng.com'

const FROM_NAME = 'Ohealth'


export async function send_mail_otp (email: String, otp: String) {

    try {

    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'Ohealth Verification Code',
    html: `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                text-align: center;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }

            .container {
                display: inline-block;
                text-align: left;
                margin: 20px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                max-width: 600px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            p {
                color: #555;
                line-height: 1.6;
                margin: 15px 0;
            }

            a {
                color: #0066cc;
                text-decoration: none;
            }

            strong {
                display: block;
                margin: 20px 0;
                font-size: 1.1em;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p>Hello,</p>
            <p>Please use the verification code below to verify your email. You can complete your log in with the OTP below.</p>

            <strong>One Time Password (OTP)</strong>
            <p><b>${otp}</b></p>

            <p>This code expires in 10 minutes and should only be used in-app. Do not click any links or share with anybody.</p>

            <p>If you didn’t attempt to register on Ohealth EMR, please change your password immediately to protect your account. For further assistance, contact us at <a href="mailto:support@emr.ohealthng.com">support@emr.ohealthng.com</a>.</p>

            <p>Need help, or have questions? Please visit our <a href="ohealthng.com">contact us page</a> or reply to this message.</p>
        </div>
    </body>
    </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })

        
        
    } catch (error) {

        console.log(error)
        
    }
    
}

// this email will be sent to the physician
export async function send_mail_booking_appointment (physician:any, patient:any, appointment:any) {

    try {


    sgMail.setApiKey(sendgrid_api_key)

    const msg = {
    to: physician.email,
    from: { email: FROM_EMAIL, name: FROM_NAME},
    subject: 'New Appointment Booking',
    html: `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Booking</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    background-color: #fff;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                p {
                    color: #555;
                    line-height: 1.6;
                    margin: 15px 0;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                strong {
                    display: block;
                    margin: 20px 0;
                    font-size: 1.1em;
                    color: #333;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <p>Hello Dr ${physician.last_name} ${physician.first_name},</p>
                <p>${patient.last_name} ${patient.first_name} has booked a/an ${appointment.appointment_type} appointment with you scheduled for ${readable_date(parseInt(appointment.time) / 1000)}.</p>

                <p>Please confirm your availability for this appointment.</p>

                <p>Best regards,</p>
                <p>Ohealth</p>
            </div>
        </body>
        </html>
`,
    }
    sgMail
    .send(msg)
    .then(() => {
        console.log(`Email sent to ${physician.email}`.yellow.bold)
    })
    .catch((error: any) => {
        console.error(`${error}`.red.bold)
    })

        
        
    } catch (error) {

        console.log(error)
        
    }

    
}


const sgMail = require('@sendgrid/mail')