export function generatePlainText(invitationLink: string): string {
  return `
    Hello,
    
    You have been invited to join LightWork, the leading home services marketplace. By joining us, you’ll gain access to a wide range of home improvement professionals and services.
    
    Why Join Us?
    Joining LightWork allows you to seamlessly find, book, and manage home services. Whether you are looking to renovate your home or handle routine maintenance, our platform makes it easy and convenient.
    
    How to Get Started:
    Simply click on the link below to register and start exploring the vast range of services we offer:
    
    Join LightWork Now: ${invitationLink}
    
    If you have any questions or need assistance, don’t hesitate to get in touch with our support team.
    
    Looking forward to welcoming you aboard!
    
    Best regards,
    The LightWork Team
      `.trim();
}

export function generateHTML(invitationLink: string): string {
  return `
    <html>
    <body>
      <p>Hello,</p>
      
      <p>You have been invited to join LightWork, the leading home services marketplace. By joining us, you’ll gain access to a wide range of home improvement professionals and services.</p>
      
      <p><strong>Why Join Us?</strong><br>
      Joining LightWork allows you to seamlessly find, book, and manage home services. Whether you are looking to renovate your home or handle routine maintenance, our platform makes it easy and convenient.</p>
      
      <p><strong>How to Get Started:</strong><br>
      Simply click on the link below to register and start exploring the vast range of services we offer:</p>
      
      <p><a href="${invitationLink}" target="_blank">Join LightWork Now</a></p>
      
      <p>If you have any questions or need assistance, don’t hesitate to get in touch with our support team.</p>
      
      <p>Looking forward to welcoming you aboard!</p>
      
      <p>Best regards,<br>
      The LightWork Team</p>
    </body>
    </html>
    `.trim();
}
