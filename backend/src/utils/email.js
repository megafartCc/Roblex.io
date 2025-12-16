import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailHost = process.env.EMAIL_HOST;
const emailPort = Number(process.env.EMAIL_PORT || 587);
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM || emailUser;
const emailSecureFlag = String(process.env.EMAIL_SECURE || '').toLowerCase();
const isSecure = emailSecureFlag === 'true' || emailSecureFlag === '1' || emailPort === 465;

// ZeptoMail HTTP API controls (used when SMTP egress is blocked)
const zeptoToken = process.env.ZEPTO_API_TOKEN;
const zeptoSendUrl = process.env.ZEPTO_SEND_URL || 'https://mail.zeptomail.com/api/sendmail';
const zeptoBounceAddress = process.env.ZEPTO_BOUNCE_ADDRESS;
const zeptoFromName = process.env.EMAIL_FROM_NAME || 'Roblex';
const useZeptoApi = Boolean(zeptoToken);

if (!useZeptoApi && (!emailHost || !emailUser || !emailPass)) {
    console.warn('[email] Missing EMAIL_HOST/EMAIL_USER/EMAIL_PASS; emails will fail to send.');
}

let transporter = null;
if (!useZeptoApi && emailHost && emailUser && emailPass) {
    const buildTransport = (host, port, secure) => nodemailer.createTransport({
        host,
        port,
        secure, // 465 => SSL, others default to STARTTLS
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        tls: {
            // Keeps STARTTLS working on shared hosts that use self-signed certs
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
    });

    // Primary transport
    transporter = buildTransport(emailHost, emailPort, isSecure);

    // Surface transport issues early
    transporter.verify()
        .then(() => console.log(`[email] SMTP ready at ${emailHost}:${emailPort} (secure=${isSecure})`))
        .catch((err) => console.error('[email] SMTP transport verification failed:', err.message));

    // Expose builder for fallback attempts
    transporter.__buildTransport = buildTransport;
}

const fetchFn = globalThis.fetch;

async function sendViaZeptoApi(toEmail, subject, htmlBody) {
    if (!fetchFn) {
        throw new Error('Fetch API is unavailable in this Node version; upgrade to Node 18+ or install node-fetch.');
    }
    if (!zeptoToken) {
        throw new Error('ZEPTO_API_TOKEN not provided.');
    }
    if (!zeptoBounceAddress) {
        throw new Error('ZEPTO_BOUNCE_ADDRESS not provided.');
    }
    if (!emailFrom) {
        throw new Error('EMAIL_FROM must be set to a verified ZeptoMail sender address.');
    }

    const payload = {
        bounce_address: zeptoBounceAddress,
        from: {
            address: emailFrom,
            name: zeptoFromName,
        },
        to: [
            {
                email_address: {
                    address: toEmail,
                },
            },
        ],
        subject,
        htmlbody: htmlBody,
    };

    const response = await fetchFn(zeptoSendUrl, {
        method: 'POST',
        headers: {
            Authorization: `Zoho-enczapikey ${zeptoToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '<unable to read body>');
        throw new Error(`ZeptoMail API ${response.status} ${response.statusText}: ${errorText}`);
    }

    return response.json().catch(() => ({}));
}

/**
 * Sends a verification code to the specified email address.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} code - The 6-digit verification code.
 */
export async function sendVerificationCodeEmail(toEmail, code) {
    const mailOptions = {
        from: emailFrom, // Sender address
        to: toEmail, // List of recipients
        subject: 'Your Roblex Account Verification Code', // Subject line
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; max-width: 600px; margin: auto;">
                <h2 style="color: #333;">Welcome to Roblex!</h2>
                <p>Thank you for registering. Please use the following 6-digit code to verify your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #007bff; background-color: #f4f4f4; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">
                        ${code}
                    </span>
                </div>
                <p>This code will expire in 5 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,<br>The Roblex Team</p>
            </div>
        `,
    };

    try {
        if (useZeptoApi) {
            console.log(`[email] Sending via ZeptoMail HTTP API to ${toEmail}`);
            const info = await sendViaZeptoApi(toEmail, mailOptions.subject, mailOptions.html);
            console.log('[email] ZeptoMail API send ok:', info?.request_id || 'no-request-id');
            return info;
        }

        if (!emailHost || !emailUser || !emailPass || !transporter) {
            throw new Error('Email transport not configured; set EMAIL_HOST/EMAIL_USER/EMAIL_PASS or provide ZEPTO_API_TOKEN.');
        }

        console.log(`DEBUG Sending mail using SMTP/${emailHost}:${emailPort} to ${toEmail}`);
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log("DEBUG Message sent: %s", info.messageId);
        console.log("DEBUG Ethereal URL (if available): %s", nodemailer.getTestMessageUrl(info));
        return info;
    } catch (error) {
        console.error("ERROR Send error: Failed to send verification code email:", error);

        if (useZeptoApi) {
            throw error;
        }

        // Retry with common fallback ports if we hit connection-level errors
        const connectionErrors = ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ENOTFOUND', 'ECONNREFUSED'];
        const shouldRetry = connectionErrors.includes(error.code);
        const buildTransport = transporter?.__buildTransport;

        if (shouldRetry && buildTransport) {
            const attempts = [];
            if (emailPort !== 587) attempts.push({ port: 587, secure: false, label: '587-starttls' });
            if (emailPort !== 465) attempts.push({ port: 465, secure: true, label: '465-ssl' });

            for (const attempt of attempts) {
                try {
                    console.warn(`[email] retrying via ${emailHost}:${attempt.port} secure=${attempt.secure} (${attempt.label})`);
                    const fallbackTx = buildTransport(emailHost, attempt.port, attempt.secure);
                    const info = await fallbackTx.sendMail(mailOptions);
                    console.log(`[email] fallback send succeeded via ${attempt.label}; message id ${info.messageId}`);
                    return info;
                } catch (retryErr) {
                    console.error(`[email] fallback ${attempt.label} failed:`, retryErr.message);
                }
            }
        }

        // Re-throw the last error so the caller surfaces it
        throw error;
    }
}
