# Decentralized Sync Architecture for StackMap
*Created: August 2025*

## 🎯 Why Decentralized?

Current centralized issues:
- Single point of failure (server)
- Race conditions between devices
- Complex conflict resolution
- Server costs
- Privacy concerns (even with encryption)

Decentralized benefits:
- No central server needed
- Direct device-to-device sync
- Local-first, offline-first
- True data ownership
- Simpler conflict resolution with CRDTs

## 🏗️ Feasible Decentralized Architectures

### 1. WebRTC Peer-to-Peer (Most Feasible for StackMap)

**How it works:**
```javascript
// Each device acts as both client and server
const peer = new SimplePeer({
  initiator: true,
  trickle: false
});

// Exchange connection data via QR code or short code
peer.on('signal', data => {
  // Share this with other device
  const connectionCode = encodeConnectionData(data);
});

// Direct encrypted connection between devices
peer.on('connect', () => {
  // Sync directly between devices
  peer.send(encryptedData);
});
```

**Pros:**
- Works on all platforms (iOS, Android, Web)
- No server infrastructure needed
- Real-time sync when devices are online together
- React Native WebRTC library available

**Cons:**
- Devices must be online simultaneously (initially)
- NAT traversal can be tricky
- Need STUN/TURN servers for connection establishment

**Implementation for StackMap:**
1. Use QR code or sync phrase for initial pairing
2. Establish WebRTC data channel
3. Exchange CRDTs directly between devices
4. Store peer connection info for future syncs

---

### 2. IPFS (InterPlanetary File System)

**How it works:**
```javascript
// Each device runs IPFS node
const ipfs = await IPFS.create();

// Publish data to IPFS
const cid = await ipfs.add(encryptedData);

// Pin data to ensure persistence
await ipfs.pin.add(cid);

// Share CID with other devices
const syncKey = `stackmap://${cid}`;

// Other devices retrieve
const data = await ipfs.cat(cid);
```

**Pros:**
- Content-addressed (data integrity built-in)
- Automatic peer discovery
- Works offline (sync when connection available)
- Data persists across network

**Cons:**
- Heavy for mobile devices
- IPFS node resource intensive
- Public network (need strong encryption)

**Implementation for StackMap:**
1. Use IPFS-lite for mobile
2. Encrypt all data before publishing
3. Use IPNS for mutable pointers
4. Consider Textile.io for easier integration

---

### 3. Bluetooth/Local Network Sync

**How it works:**
```javascript
// Discover nearby devices
BluetoothLE.startScanning({
  services: ['stackmap-sync-service']
});

// Establish connection
const connection = await BluetoothLE.connect(device);

// Exchange data directly
await connection.write(encryptedData);
```

**Pros:**
- No internet required
- Perfect for family devices
- Low power consumption
- Very private

**Cons:**
- Limited to proximity
- Platform-specific implementations
- Slower transfer speeds

**Implementation for StackMap:**
1. Primary sync via WebRTC
2. Bluetooth as fallback for family devices
3. Auto-sync when devices are near

---

### 4. Matrix Protocol (Federated)

**How it works:**
```javascript
// Use Matrix for decentralized communication
const client = sdk.createClient({
  baseUrl: "https://matrix.org", // Or self-hosted
  userId: "@user:matrix.org"
});

// Create encrypted room for sync
const room = await client.createRoom({
  room_alias_name: syncId,
  visibility: 'private',
  preset: 'private_chat',
  initial_state: [{
    type: 'm.room.encryption',
    content: { algorithm: 'm.megolm.v1.aes-sha2' }
  }]
});

// Send sync data as events
await client.sendEvent(room.roomId, 'stackmap.sync', encryptedData);
```

**Pros:**
- Federated (can self-host)
- End-to-end encryption built-in
- Offline message queue
- Open protocol

**Cons:**
- Still needs servers (but federated)
- More complex than P2P
- Requires Matrix homeserver

---

### 5. Hypercore Protocol (Dat)

**How it works:**
```javascript
// Create append-only log
const feed = new Hypercore('./sync-data');

// Append changes
await feed.append({
  type: 'activity.complete',
  id: 'abc123',
  timestamp: Date.now()
});

// Share feed key
const syncKey = feed.key.toString('hex');

// Replicate with peers
const swarm = new Hyperswarm();
swarm.join(feed.discoveryKey);
swarm.on('connection', conn => {
  feed.replicate(conn);
});
```

**Pros:**
- Append-only log (perfect for event sourcing)
- Automatic conflict resolution
- P2P replication
- Works offline

**Cons:**
- Newer technology
- Limited React Native support
- Requires understanding of append-only logs

---

## 🎯 Recommended Approach for StackMap

### Hybrid Progressive Decentralization

**Phase 1: WebRTC + Fallback Server (Immediate)**
```javascript
class HybridSync {
  async sync() {
    // Try P2P first
    if (this.peers.length > 0) {
      return this.syncViaPeers();
    }
    
    // Fallback to server (encrypted)
    return this.syncViaServer();
  }
  
  async syncViaPeers() {
    // Direct WebRTC sync with CRDTs
    const changes = this.crdt.getChanges();
    this.peers.forEach(peer => {
      peer.send(changes);
    });
  }
}
```

**Phase 2: CRDT Implementation**
Use Yjs or Automerge for conflict-free sync:
```javascript
// No more conflict resolution needed!
const ydoc = new Y.Doc();
const activities = ydoc.getMap('activities');

// Changes automatically merge
activities.set(activityId, {
  completed: true,
  completedAt: Date.now()
});

// Sync is just exchanging updates
const update = Y.encodeStateAsUpdate(ydoc);
peer.send(update);
```

**Phase 3: Progressive Enhancement**
- Add Bluetooth for local sync
- Add IPFS for persistent backup
- Add Matrix for federated option

---

## 📊 Comparison with Current Architecture

| Aspect | Current (Centralized) | Proposed (Decentralized) |
|--------|--------------------|------------------------|
| Conflict Resolution | Complex (timestamps) | Automatic (CRDTs) |
| Code Complexity | 2200+ lines | ~500 lines |
| Server Required | Yes (always) | Optional (fallback) |
| Offline Support | Queue + conflicts | Full offline-first |
| Privacy | Encrypted on server | Never leaves devices |
| Cost | Server hosting | Minimal/none |
| Sync Speed | 30-second intervals | Real-time when connected |

---

## 🔧 Implementation Plan

### Step 1: Add CRDT Library (1 week)
```bash
npm install yjs y-webrtc y-indexeddb
```

### Step 2: Replace Conflict Resolution (1 week)
```javascript
// Before: Complex timestamp comparison
if (local.modifiedAt > remote.modifiedAt) {...}

// After: Automatic
ydoc.transact(() => {
  activities.set(id, newState);
});
```

### Step 3: Add WebRTC Sync (2 weeks)
- Peer discovery via sync code
- Direct data exchange
- Fallback to server if offline

### Step 4: Progressive Migration (2 weeks)
- Run both systems in parallel
- Migrate users gradually
- Remove old sync code

---

## 🎉 Benefits for StackMap Users

1. **No more reversions** - CRDTs prevent conflicts
2. **Instant sync** - Real-time when devices connected
3. **Family privacy** - Data never leaves family devices
4. **Offline-first** - Full functionality without internet
5. **Lower costs** - Minimal server infrastructure
6. **True ownership** - Users control their data

---

## 🚀 Quick Win: CRDT-Only Fix

Even without full decentralization, just adding CRDTs would fix the reversion issue:

```javascript
// Replace current sync with Yjs
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

const ydoc = new Y.Doc();
const provider = new WebrtcProvider(
  'stackmap-' + syncId,
  ydoc,
  { 
    signaling: ['wss://signaling.stackmap.app'], // Minimal signaling server
    password: encryptionKey 
  }
);

// That's it! Sync now works automatically
```

This would:
- Fix all reversion issues
- Reduce sync code from 2200 to ~200 lines
- Work with existing infrastructure
- Provide stepping stone to full decentralization

---

## 📚 Resources

- [Yjs](https://yjs.dev/) - CRDT implementation
- [WebRTC React Native](https://github.com/react-native-webrtc/react-native-webrtc)
- [IPFS Mobile](https://github.com/textileio/js-ipfs-lite)
- [Matrix SDK](https://matrix.org/sdks/)
- [Hypercore Protocol](https://hypercore-protocol.org/)
- [Local-First Software](https://www.inkandswitch.com/local-first/)