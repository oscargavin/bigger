import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { messages, pairings, users } from "@/db/schema";
import { and, eq, desc, isNull, or, lt, not } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const messagesRouter = createTRPCRouter({
  getMessages: protectedProcedure
    .input(z.object({
      pairingId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { pairingId, limit, cursor } = input;
      
      // Verify user is part of this pairing
      const pairing = await ctx.db.query.pairings.findFirst({
        where: and(
          eq(pairings.id, pairingId),
          or(
            eq(pairings.user1Id, ctx.user.id),
            eq(pairings.user2Id, ctx.user.id)
          )
        ),
      });

      if (!pairing) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You are not part of this pairing" 
        });
      }

      const msgs = await ctx.db.query.messages.findMany({
        where: and(
          eq(messages.pairingId, pairingId),
          isNull(messages.deletedAt),
          cursor ? lt(messages.createdAt, cursor) : undefined
        ),
        orderBy: [desc(messages.createdAt)],
        limit: limit + 1,
        with: {
          sender: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      let nextCursor: Date | undefined = undefined;
      if (msgs.length > limit) {
        const nextItem = msgs.pop();
        nextCursor = nextItem!.createdAt || undefined;
      }

      return {
        messages: msgs,
        nextCursor,
      };
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      pairingId: z.string().uuid(),
      content: z.string().min(1).max(1000),
      messageType: z.enum(['text', 'celebration', 'encouragement', 'challenge']).default('text'),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { pairingId, content, messageType, metadata } = input;
      
      // Verify user is part of this pairing
      const pairing = await ctx.db.query.pairings.findFirst({
        where: and(
          eq(pairings.id, pairingId),
          or(
            eq(pairings.user1Id, ctx.user.id),
            eq(pairings.user2Id, ctx.user.id)
          )
        ),
      });

      if (!pairing) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You are not part of this pairing" 
        });
      }

      const [message] = await ctx.db.insert(messages).values({
        pairingId,
        senderId: ctx.user.id,
        content,
        messageType,
        metadata: metadata || {},
      }).returning();

      // Get sender info
      const messageWithSender = await ctx.db.query.messages.findFirst({
        where: eq(messages.id, message.id),
        with: {
          sender: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return messageWithSender;
    }),

  markAsRead: protectedProcedure
    .input(z.object({
      messageId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { messageId } = input;

      // Get message and verify it's for the current user
      const message = await ctx.db.query.messages.findFirst({
        where: eq(messages.id, messageId),
        with: {
          pairing: true,
        },
      });

      if (!message) {
        throw new TRPCError({ 
          code: "NOT_FOUND",
          message: "Message not found" 
        });
      }

      // Verify user is the recipient (not the sender)
      const isRecipient = message.senderId !== ctx.user.id && 
        (message.pairing.user1Id === ctx.user.id || message.pairing.user2Id === ctx.user.id);

      if (!isRecipient) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You cannot mark this message as read" 
        });
      }

      const [updated] = await ctx.db
        .update(messages)
        .set({ readAt: new Date() })
        .where(eq(messages.id, messageId))
        .returning();

      return updated;
    }),

  editMessage: protectedProcedure
    .input(z.object({
      messageId: z.string().uuid(),
      content: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { messageId, content } = input;

      // Verify message belongs to user
      const message = await ctx.db.query.messages.findFirst({
        where: and(
          eq(messages.id, messageId),
          eq(messages.senderId, ctx.user.id),
          isNull(messages.deletedAt)
        ),
      });

      if (!message) {
        throw new TRPCError({ 
          code: "NOT_FOUND",
          message: "Message not found or you don't have permission to edit it" 
        });
      }

      const [updated] = await ctx.db
        .update(messages)
        .set({ 
          content,
          editedAt: new Date() 
        })
        .where(eq(messages.id, messageId))
        .returning();

      return updated;
    }),

  deleteMessage: protectedProcedure
    .input(z.object({
      messageId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { messageId } = input;

      // Verify message belongs to user
      const message = await ctx.db.query.messages.findFirst({
        where: and(
          eq(messages.id, messageId),
          eq(messages.senderId, ctx.user.id),
          isNull(messages.deletedAt)
        ),
      });

      if (!message) {
        throw new TRPCError({ 
          code: "NOT_FOUND",
          message: "Message not found or you don't have permission to delete it" 
        });
      }

      const [deleted] = await ctx.db
        .update(messages)
        .set({ deletedAt: new Date() })
        .where(eq(messages.id, messageId))
        .returning();

      return deleted;
    }),

  getUnreadCount: protectedProcedure
    .input(z.object({
      pairingId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const { pairingId } = input;
      
      // Verify user is part of this pairing
      const pairing = await ctx.db.query.pairings.findFirst({
        where: and(
          eq(pairings.id, pairingId),
          or(
            eq(pairings.user1Id, ctx.user.id),
            eq(pairings.user2Id, ctx.user.id)
          )
        ),
      });

      if (!pairing) {
        return { count: 0 };
      }

      const unreadMessages = await ctx.db.query.messages.findMany({
        where: and(
          eq(messages.pairingId, pairingId),
          not(eq(messages.senderId, ctx.user.id)),
          isNull(messages.readAt),
          isNull(messages.deletedAt)
        ),
      });

      return { count: unreadMessages.length };
    }),
});