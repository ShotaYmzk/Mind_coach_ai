/**
 * Google Meet URL生成用のユーティリティ
 * 将来的に実際のGoogle Calendar APIと連携する予定
 */

/**
 * ダミーのGoogle MeetリンクURLを生成する
 * 本番環境では実際のGoogle Calendar APIを使用して会議を作成する
 * 
 * @param date 予約日時
 * @param name ユーザー名
 * @returns ダミーのGoogle Meet URL
 */
export function generateMeetingUrl(date: Date, name: string): string {
  // 実際のGoogle Meet URLに似せたダミーURLを生成
  const randomCode = Array(10)
    .fill(0)
    .map(() => Math.random().toString(36).substring(2, 3))
    .join("");
  
  const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '');
  
  // 通常、本番環境ではGoogleのAPIを使ってリンクを生成するが、ここではダミーを返す
  return `https://meet.google.com/${formattedDate}-${randomCode}-xyz`;
}

/**
 * 会議の詳細を含むHTMLメール本文を生成する
 * 
 * @param params 会議情報パラメータ
 * @returns HTMLメール本文
 */
export function generateMeetingEmailContent(params: {
  userName: string;
  coachName: string;
  date: Date;
  duration: number;
  meetingUrl: string;
}): string {
  const { userName, coachName, date, duration, meetingUrl } = params;
  
  // 日時のフォーマット
  const formattedDate = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #e25822; margin-bottom: 20px;">メンタルAI: コーチングセッションが予約されました</h2>
      
      <p style="margin-bottom: 15px;">こんにちは ${userName}さん,</p>
      
      <p style="margin-bottom: 15px;">コーチングセッションが正常に予約されました。詳細は以下の通りです：</p>
      
      <div style="background-color: #f9f5f1; border-left: 4px solid #e25822; padding: 15px; margin-bottom: 20px;">
        <p><strong>日付:</strong> ${formattedDate}</p>
        <p><strong>時間:</strong> ${formattedTime}</p>
        <p><strong>所要時間:</strong> ${duration}分</p>
        <p><strong>コーチ:</strong> ${coachName}</p>
      </div>
      
      <p style="margin-bottom: 20px;">
        <a href="${meetingUrl}" style="background-color: #e25822; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Google Meetで参加する
        </a>
      </p>
      
      <p style="margin-bottom: 15px;">セッションの5〜10分前にリンクをクリックして、接続をテストすることをお勧めします。</p>
      
      <p>質問がある場合は、このメールに返信するか、support@mental-ai.jp までご連絡ください。</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="color: #777; font-size: 12px;">
        このメールはシステムによって自動的に送信されています。
        予約をキャンセルまたは変更する場合は、アカウントにログインしてください。
      </p>
    </div>
  `;
}