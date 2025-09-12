const nodemailer = require('nodemailer');

// 이메일 전송을 위한 설정
const createTransporter = () => {
  // Gmail 사용 예제 (다른 이메일 서비스도 사용 가능)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// 비밀번호 재설정 이메일 전송
const sendPasswordResetEmail = async (email, resetToken, newPassword) => {
  const transporter = createTransporter();
  
  // If resetToken is provided, send reset link; otherwise send temporary password (backward compatibility)
  const isResetLink = resetToken && !newPassword;
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '꿈 해석 서비스 - 비밀번호 재설정',
    html: isResetLink ? `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #667eea; text-align: center;">비밀번호 재설정</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>안녕하세요!</h3>
          <p>비밀번호 재설정을 요청하셨습니다.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; border: 2px solid #667eea;">
            <p style="margin: 0 0 15px 0; font-weight: bold;">아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:</p>
            <a href="${resetUrl}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
              비밀번호 재설정하기
            </a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              ⏰ <strong>이 링크는 20분 후에 만료됩니다.</strong><br>
              🔒 <strong>링크는 한 번만 사용할 수 있습니다.</strong>
            </p>
          </div>
          
          <p style="color: #666; margin-top: 20px;">
            만약 비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시해주세요.
          </p>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            링크가 작동하지 않는 경우 아래 URL을 복사하여 브라우저 주소창에 입력해주세요:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      </div>
    ` : `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #667eea; text-align: center;">비밀번호 재설정</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>안녕하세요!</h3>
          <p>요청하신 비밀번호 재설정을 완료했습니다.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #667eea;">
            <strong>새로운 임시 비밀번호: </strong>
            <span style="font-size: 18px; color: #e74c3c; font-weight: bold;">${newPassword}</span>
          </div>
          
          <p style="color: #666; margin-top: 20px;">
            ⚠️ <strong>보안을 위해 로그인 후 비밀번호를 변경해주세요.</strong>
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
              로그인하기
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px;">
            이 메일에 대해 문의사항이 있으시면 답장하지 마시고 관리자에게 연락해주세요.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail
};