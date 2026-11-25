---
title: Sync between devices
slug: docs/engramma/sync
---

The same memory on **your** devices: the laptop, the home Mac, later the phone. Sharing with other people arrives on top of this base, in the organizations release.

## Pairing a device

Two ways, one outcome.

**The ticket** — no server. `engramma devices invite` binds the pairing endpoint and prints the inviter's real address plus a 128-bit secret, valid **ten minutes** and **one use**:

```console
$ engramma devices invite --no-relay --name portatile
biglietto (dieci minuti, un uso):
engramma-invite-v1.gqjzfquw7csdmdoekhft7yatglck…
in attesa del dispositivo che entra…
```

On the new device: `engramma devices join <ticket> --name <name>`.

**The short code** — with the blind mailbox as the meeting point. `engramma devices code` prints something like `7-tigre-lago`: a channel number and two Italian words from a fixed list of 2048. The two sides meet on the node and run SPAKE2 with the code as password; the node sees only the channel number, and one attempt per code.

Either way, at the end **both screens print the same six digits**. You compare them and confirm on both devices — only then is the `add` signed.

## Sharing a cell

```sh
engramma sync share <cella>
```

The cell records an `adopt` operation (a Merkle root of everything that existed) and opens epoch 0 of its key. From there every operation travels **sealed**: XChaCha20-Poly1305 under an epoch key, the epoch key wrapped for each device with HPKE. `engramma sync unshare <cella>` stops sharing **from here**; the copies elsewhere stay, and the command says so.

One service per root: an exclusive lock covers `sync serve` and every `sync run`.

- `engramma sync run` — one pass with every reachable live device, then exit. An unreachable device is a line in the summary, not an error.
- `engramma sync serve` — listens, syncs on every local write and every five minutes; it runs beside Homun on the same root.

## The relay: public, your own, or none

By default the public relay of n0 (iroh); your own with `--relay <url>`; none with `--no-relay`, direct connections only. The relay traverses NAT inside QUIC and sees only ciphertext: the envelopes are sealed for it too. Publishing the address on DNS (pkarr) is off by default.

## What everyone sees

| | relay | blind mailbox | another device of the list |
|---|---|---|---|
| endpoint keys, IPs, times, sizes | yes | yes | yes (it is a peer) |
| note text, cell names, titles, tags, authors | no | no | yes (it is of the list) |

The blind mailbox (`engramma mailbox serve`) is an always-on endpoint that stores and delivers sealed envelopes when your devices are not on together. It holds **no keys**: it cannot read what it keeps, it accepts only the transport keys of live devices, and when a note is purged the signed deletion request reaches it at the next session — the envelopes of that note are really gone, VACUUM included.

## Conflicts

Concurrent body edits never lose text: the winner is picked by (author class, HLC, op id) — a human hand beats an agent even an older one — and every loser keeps a durable **conflict copy**, identical on every copy of the cell. An agent's loser is born in quarantine, in the proposal queue. `engramma conflicts` lists them, `engramma conflicts resolve <copy> --keep original|copy|merged` settles them.

## Losing a device

From another device:

```sh
engramma devices remove <nome>
```

It removes the device from the list, **rotates the key of every shared cell** (a new epoch: new operations are no longer readable there), and rejects operations signed by it that the removing device had not already accepted. What the removed device **already had, it keeps**: revocation acts on the future. The six digits and the one-use ticket are the pairing's defenses; the rotation is the defense of the after.

Devices with different protocol versions refuse each other at the handshake, before a single operation moves — update both, and sync resumes where it was.
