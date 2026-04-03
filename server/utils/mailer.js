import nodemailer from 'nodemailer'

// QQ邮箱SMTP配置（需要在环境变量中设置）
// QQ邮箱 -> 设置 -> 账户 -> 生成授权码
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'noreply@mzpost.cn',  // 发送邮箱
    pass: process.env.EMAIL_PASS || ''  // QQ邮箱授权码
  }
})

// 发送验证码邮件
export async function sendVerifyCode(email, code) {
  const mailOptions = {
    from: `"一体两面·摄影工具站" <${process.env.EMAIL_USER || 'noreply@mzpost.cn'}>`,
    to: email,
    subject: '【验证码】一体两面·摄影工具站注册验证',
    html: `
      <div style="max-width: 400px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
        <h2 style="color: #333; text-align: center;">注册验证码</h2>
        <p style="color: #666;">您好！</p>
        <p style="color: #666;">您正在注册「一体两面·摄影工具站」账号，验证码为：</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #999; font-size: 12px;">验证码5分钟内有效，请勿泄露给他人。</p>
        <p style="color: #999; font-size: 12px;">如非本人操作，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #ccc; font-size: 11px; text-align: center;">一体两面·摄影工具站</p>
      </div>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`[邮件] 验证码已发送到 ${email}， messageId: ${info.messageId}`)
    return true
  } catch (error) {
    console.error(`[邮件] 发送失败: ${error.message}`)
    throw error
  }
}

// 发送密码重置验证码
export async function sendResetCode(email, code) {
  const mailOptions = {
    from: `"一体两面·摄影工具站" <${process.env.EMAIL_USER || 'noreply@mzpost.cn'}>`,
    to: email,
    subject: '【重置密码】一体两面·摄影工具站',
    html: `
      <div style="max-width: 400px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
        <h2 style="color: #333; text-align: center;">重置密码</h2>
        <p style="color: #666;">您好！</p>
        <p style="color: #666;">您正在重置「一体两面·摄影工具站」账号密码，验证码为：</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #e53e3e; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #999; font-size: 12px;">验证码5分钟内有效，请勿泄露给他人。</p>
        <p style="color: #999; font-size: 12px;">如非本人操作，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #ccc; font-size: 11px; text-align: center;">一体两面·摄影工具站</p>
      </div>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`[邮件] 密码重置验证码已发送到 ${email}， messageId: ${info.messageId}`)
    return true
  } catch (error) {
    console.error(`[邮件] 发送失败: ${error.message}`)
    throw error
  }
}
