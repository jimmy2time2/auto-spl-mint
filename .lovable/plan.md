
# Community Chat — Discord-Style Global Chat Room

## What's Being Built

A full-featured, real-time global community chat section at the bottom of the dashboard, styled in the existing M9 terminal/Y2K aesthetic. It mirrors core Discord functionality: text messages, image/GIF/meme uploads, emoji picker, and realtime delivery to all connected users.

---

## Database Changes

A new `community_messages` table is needed to store all chat messages with support for media attachments.

**New table: `community_messages`**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| wallet_address | text | Sender identifier (Solana address) |
| content | text | Text content (nullable if media only) |
| media_url | text | URL of uploaded image/GIF (nullable) |
| media_type | text | 'image', 'gif', or null |
| created_at | timestamptz | Default now() |

**RLS Policies:**
- SELECT: Public (everyone can read)
- INSERT: Validated wallet address format (same pattern as `token_comments`)
- No UPDATE / DELETE by users

**Realtime:** The table will be added to the Supabase realtime publication so all connected browsers receive new messages instantly.

**Storage Bucket:** A public storage bucket called `chat-media` will be created for image/GIF uploads. Files will be stored there and only the URL will be saved in the database.

---

## New Files

### `src/components/panels/CommunityPanel.tsx`

The main Discord-style chat component with:

- **Message list** — scrollable, newest at bottom, auto-scrolls on new message
- **Message bubbles** — shows truncated wallet address, timestamp, text content, and/or image
- **Image/GIF rendering** — inline display with max height cap, click to expand
- **Emoji picker** — a custom grid of common emojis that inserts into the text input (no external library needed)
- **Upload button** — file input for images (jpg, png, gif, webp) up to 5MB, uploads to `chat-media` bucket and stores URL
- **Text input** — single-line input with Enter to send, Shift+Enter for newline
- **Realtime subscription** — listens to INSERT events on `community_messages`
- **Wallet address input** — shown once if not yet entered, persisted in `localStorage`

---

## Dashboard Integration

In `src/pages/Dashboard.tsx`, a new `CollapsibleSection` will be added **before the footer**, using a `MessageSquare` icon from lucide-react:

```text
EXPLORER TOKENS
DAO GOVERNANCE
LEADERBOARDS
AI LOGBOOK
YOUR WALLET
COMMUNITY CHAT  ← new, added here
[Footer]
```

---

## Detailed Component Design

```text
┌──────────────────────────────────────────────────────┐
│  COMMUNITY CHAT                              [open v] │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │  [scroll area - 400px height]                  │  │
│  │                                                │  │
│  │  0xAB...1F · 2m ago                           │  │
│  │  this token is gonna moon 🚀                  │  │
│  │                                                │  │
│  │  0xDE...7C · 1m ago                           │  │
│  │  [image: uploaded meme]                       │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Wallet: [0xABC...] (stored in localStorage)         │
│                                                      │
│  ┌──────────────────────────┐ [😀] [📎] [SEND]      │
│  │ Say something...          │                       │
│  └──────────────────────────┘                       │
│                                                      │
│  (emoji picker dropdown, appears above input)        │
└──────────────────────────────────────────────────────┘
```

---

## Technical Implementation Details

**Emoji Picker:** A popover with ~60 common emojis arranged in a grid. No external package needed — just Unicode characters rendered as clickable buttons that append to the message text.

**File Uploads:**
1. User selects a file (jpg/png/gif/webp, max 5MB)
2. File is uploaded to the `chat-media` Supabase storage bucket
3. The public URL is retrieved
4. Message is inserted with `media_url` and `media_type = 'image'`

**GIF Support:** GIFs are treated as images. Animated GIFs will play automatically since they're rendered with a standard `<img>` tag.

**Realtime:** A Supabase channel subscription on `community_messages` table INSERT events will push new messages to all connected clients without polling.

**Wallet persistence:** The wallet address entered by the user is saved to `localStorage` under the key `m9_chat_wallet` so they don't have to re-enter it each session.

**Rate limiting:** The RLS INSERT policy will validate the wallet address format. No more than 1 message per second per wallet will be enforced client-side by disabling the send button for 1 second after each send.

**Scroll behavior:** The message list auto-scrolls to the bottom when a new message arrives, unless the user has manually scrolled up (scroll lock detection).

---

## Files to Create / Modify

1. **Database migration** — new `community_messages` table + RLS + realtime + storage bucket
2. **NEW** `src/components/panels/CommunityPanel.tsx` — full Discord-style chat UI
3. **EDIT** `src/pages/Dashboard.tsx` — add the CommunityPanel as a new CollapsibleSection with `MessageSquare` icon
