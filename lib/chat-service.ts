import { db } from '@/db';
import { chats, messages, type Chat, type Message, type NewChat, type NewMessage } from '@/db/chat-schema';
import { eq, desc } from 'drizzle-orm';

export class ChatService {
  static async createChat(userId: string, title?: string): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values({
        userId,
        title: title || 'New Chat',
      })
      .returning();
    
    return chat;
  }

  static async getChat(chatId: string): Promise<Chat | null> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);
    
    return chat || null;
  }

  static async getUserChats(userId: string): Promise<Chat[]> {
    return db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }

  static async updateChatTitle(chatId: string, title: string): Promise<void> {
    await db
      .update(chats)
      .set({ 
        title,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId));
  }

  static async deleteChat(chatId: string): Promise<void> {
    await db
      .delete(chats)
      .where(eq(chats.id, chatId));
  }

  static async addMessage(
    chatId: string,
    role: string,
    content: string,
    metadata?: any
  ): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        chatId,
        role,
        content,
        metadata,
      })
      .returning();

    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    return message;
  }

  static async getChatMessages(chatId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }

  static async deleteMessage(messageId: string): Promise<void> {
    await db
      .delete(messages)
      .where(eq(messages.id, messageId));
  }

  static async searchChats(userId: string, query: string): Promise<Chat[]> {
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId));

    return userChats.filter(chat => 
      chat.title.toLowerCase().includes(query.toLowerCase())
    );
  }
}