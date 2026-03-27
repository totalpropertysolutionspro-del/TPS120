import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { contacts } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Get all contacts
router.get("/", async (req: Request, res: Response) => {
  try {
    const allContacts = await db.select().from(contacts).all();
    res.json(allContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Get single contact
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const contact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, req.params.id))
      .get();

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ error: "Failed to fetch contact" });
  }
});

// Create contact
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, role, type, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Missing required fields (name, type)" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newContact = {
      id,
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      role: role || null,
      type,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(contacts).values(newContact);
    res.status(201).json(newContact);
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// Update contact
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, role, type, notes } = req.body;

    const existingContact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, req.params.id))
      .get();

    if (!existingContact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const updatedContact = {
      ...existingContact,
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(company !== undefined && { company }),
      ...(role !== undefined && { role }),
      ...(type && { type }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(contacts)
      .set(updatedContact)
      .where(eq(contacts.id, req.params.id))
      .run();

    res.json(updatedContact);
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// Delete contact
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existingContact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, req.params.id))
      .get();

    if (!existingContact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    await db
      .delete(contacts)
      .where(eq(contacts.id, req.params.id))
      .run();

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
