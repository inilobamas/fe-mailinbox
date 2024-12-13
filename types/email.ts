export interface Attachment {
  Filename: string;
  FileUrl: string;
}

export interface Email {
  user_encode_id: string;
  email_encode_id: string;
  ID: number;
  IsRead: boolean;
  UserID: number,
  SenderEmail: string;
  SenderName: string;
  Subject: string;
  Preview: string;
  RelativeTime: string;
  Body: string; // May contain HTML content
  Recipient: string;
  Timestamp: string;
  ListAttachments: Attachment;
}