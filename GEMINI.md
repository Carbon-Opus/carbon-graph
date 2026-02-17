# Gemini Code Assistant Project Context

This document provides context for the Gemini Code Assistant to understand the structure and conventions of the CarbonOpus dApp codebase.

## Project Overview

### The Problem We're Solving
Right now, the music industry is broken for independent artists:
Spotify pays artists $0.003 per stream (you need 300,000+ streams just to make minimum wage)
Artists keep only 15-30% of their streaming revenue while middlemen take the rest
12 million independent artists worldwide are struggling to monetize their passion
Fans have no way to financially benefit from discovering and sharing great music early
We're changing that.

### What We're Building
An all-in-one social music platform that empowers independent artists to take control of their careers and rewards fans for being part of the journey.

### For Artists:
Upload music and set your own prices - no middlemen, no gatekeepers
Keep 84-99% of all sales (we only take 1%)
Launch your own creator token - let fans invest in your future success
AI-powered content creation - auto-generate posts, captions, and social content
Cross-platform posting - automatically share to Instagram, Twitter, TikTok, etc.
Own your audience - direct relationship with your fans

### For Fans:
Buy music and truly own it - not rent it like on streaming platforms
Earn money by sharing - when you share a song and someone buys it, you get paid (artist sets the %)
Invest in artists you believe in - buy creator tokens and profit as artists grow
Support artists directly - your money goes straight to the creator
Discover new music in a vibrant social feed

### How the Magic Happens:
Artist uploads a track and sets the price (say, $1)
Fan buys the track for $1 and gets full ownership
Fan shares with friends who also love it
Friends buy the track and the original fan earns 15% of each sale
Artist gets 84%, fan gets 15%, we get 1%
Everyone wins - and music spreads virally because fans are incentivized to share
This creates a viral growth loop where the better the music, the more people share it, the more everyone earns.

### Current Status
We've been heads-down building for months and we're almost there:
MVP is 95% complete - launching publicly in 60 days
Core features working: Upload, purchase, social feed, fan resale rewards
Payment processing integrated - ready for real transactions
AI content tools live - helping artists create and schedule posts
Smart contracts developed - for creator tokens (awaiting audit)
20+ beta testers giving us amazing feedback and validation
The reception from independent artists has been incredible. They're hungry for an alternative to exploitative streaming platforms.

### What Makes Us Different
There are other music platforms out there, but none combine: ✅ Direct artist sales (84-99% revenue share)
 ✅ Fan financial rewards for sharing (viral growth mechanic)
 ✅ Creator tokenization (fans invest in artist success)
 ✅ AI-powered tools (content creation & automation)
 ✅ Social-first experience (discovery + community)
 ✅ Cross-platform integration (post everywhere from one place)
We're not just building another streaming service. We're building the platform where independent artists launch their careers, build real fan communities, and actually make money from their art.

### Our Vision
We believe every independent artist should be able to make a living doing what they love.
We believe fans should profit from discovering great artists early.
We believe music should bring people together, not just extract value from them.
Right now, the music industry makes billions while artists struggle. We're flipping that model on its head.

# CarbonOpus Contracts

For detailed information about the smart contracts, including their lifecycle, functions, and events, please refer to:

[ref/contracts.md](ref/contracts.md)

### Contract ABIs

The JSON ABI files for the contracts are available in `ref/abis/`

# CarbonOpus Subgraph

This subgraph indexes the CarbonOpus protocol on the Somnia chain, providing a rich and queryable API for all on-chain activities related to the `CarbonCoinLauncher` and `CarbonCoin` smart contracts.
