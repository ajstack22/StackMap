# StackMap Sync - Cost Analysis for 500 Users

## Storage Requirements

### Per-User Data Size Estimates

**Average StackMap Data:**
- Activities/Templates: ~50 activities × 200 bytes = 10 KB
- Completed Activities: ~365 days × 10 activities × 50 bytes = 180 KB
- User Settings & Preferences: ~5 KB
- **Raw Data per User**: ~195 KB

**After Encryption & Base64:**
- Encryption overhead: ~10%
- Base64 encoding: +33%
- **Stored Data per User**: ~280 KB

**Database Overhead:**
- Indexes, metadata, device tracking: ~20 KB
- **Total per User**: ~300 KB

### Total Storage for 500 Users
- Active data: 500 × 300 KB = **150 MB**
- With growth buffer (2x): **300 MB**
- With backups: **600 MB**

## MySQL Database Costs

### Typical Shared Hosting (Namecheap)
Most shared hosting plans include:
- ✅ Unlimited MySQL databases
- ✅ 20-50 GB disk space
- ✅ No additional storage fees
- **Cost**: $0 (included in hosting)

### Database Resource Usage
- **Storage**: 600 MB < 1 GB (minimal)
- **Queries**: ~10 queries/user/day = 5,000 queries/day
- **Bandwidth**: ~1 MB/user/month = 500 MB/month

## Where Fees Come From

### 1. **Hosting Plan (Primary Cost)**
**Namecheap Stellar Plus** (example):
- $7.88/month
- Includes:
  - 20 GB storage (we use <1 GB)
  - Unlimited bandwidth
  - Unlimited MySQL databases
  - PHP support

### 2. **Bandwidth**
**Data Transfer Estimates:**
- Sync payload: ~300 KB per sync
- Syncs per user per day: ~20
- Daily bandwidth: 500 users × 20 × 300 KB = 3 GB/day
- Monthly bandwidth: ~90 GB

**Cost**: Usually included in hosting plan

### 3. **CPU/Memory Resources**
**Processing Requirements:**
- PHP script execution
- MySQL queries
- Rate limiting checks

**Cost**: Included in shared hosting up to limits

### 4. **SSL Certificate**
- Let's Encrypt: **Free**
- Or included with hosting plan

## Cost Breakdown for 500 Users

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Hosting (Stellar Plus) | $7.88 | Includes everything |
| Additional Storage | $0 | Using <1% of included |
| Bandwidth Overage | $0 | Within included limits |
| SSL Certificate | $0 | Let's Encrypt |
| Database | $0 | Included |
| **Total** | **$7.88/month** | $0.016 per user |

## Scaling Considerations

### When You Might Need to Upgrade:

**1. At ~2,000 Users:**
- Storage: 600 MB × 4 = 2.4 GB
- Bandwidth: 360 GB/month
- May need VPS hosting (~$20-30/month)

**2. At ~10,000 Users:**
- Storage: 3 GB
- Bandwidth: 1.8 TB/month
- Dedicated server recommended (~$80-150/month)

### Resource Limits to Watch:
1. **CPU Usage** (most likely limit to hit first)
   - Encryption/decryption operations
   - Database queries
   
2. **Concurrent Connections**
   - MySQL connection limits
   - PHP process limits

3. **I/O Operations**
   - Database writes during peak hours

## Optimization Strategies

### To Maximize Shared Hosting:
1. **Implement caching**
   - Cache unchanged sync data
   - Reduce database queries

2. **Optimize queries**
   - Use indexes effectively
   - Batch operations

3. **Rate limiting**
   - Prevent abuse
   - Smooth out traffic spikes

4. **Data compression**
   - Gzip responses
   - Compress before encryption

## Alternative Hosting Options

### If Shared Hosting Becomes Insufficient:

**1. VPS (500-5,000 users)**
- DigitalOcean: $20-40/month
- Linode: $20-40/month
- More CPU, dedicated resources

**2. Managed Database**
- DigitalOcean Managed MySQL: $15/month
- AWS RDS: $15-30/month
- Better performance, automatic backups

**3. Cloud Functions + Database**
- Cloudflare Workers + D1: ~$5-20/month
- Vercel + PlanetScale: ~$20-40/month
- Serverless, auto-scaling

## Summary

For 500 users, StackMap Sync costs are minimal:
- **Total Cost**: ~$8/month (existing hosting)
- **Per User**: ~$0.016/month
- **Primary Resource**: CPU, not storage
- **Scaling Point**: ~2,000 users

The zero-knowledge architecture keeps storage efficient since we only store encrypted blobs, not complex relational data. The main scaling concern will be CPU usage from encryption operations, not storage costs.