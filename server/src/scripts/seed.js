import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { env } from "../config/env.js"
import { Tenant } from "../models/Tenant.js"
import { User } from "../models/User.js"


async function seed() {
  try {
    await mongoose.connect(env.mongoUri);

    console.log("MongoDB connected");

    // Clear existing tenant/user data
    await User.deleteMany({});
    await Tenant.deleteMany({});


    const tenants = await Tenant.insertMany([
      {
        name: "Acme Corporation",
        slug: "acme-corporation",
      },
      {
        name: "Tech Solutions",
        slug: "tech-solutions",
      },
    ]);

    const acme = tenants[0];
    const tech = tenants[1];

    const passwordHash = await bcrypt.hash("Password123!", 10);

    await User.insertMany([
      {
        tenantId: acme._id,
        fullName: "Acme Owner",
        email: "owner@acme.com",
        passwordHash,
        role: "owner",
      },
      {
        tenantId: acme._id,
        fullName: "Acme Admin",
        email: "admin@acme.com",
        passwordHash,
        role: "admin",
      },
      {
        tenantId: acme._id,
        fullName: "Acme Viewer",
        email: "viewer@acme.com",
        passwordHash,
        role: "viewer",
      },
      {
        tenantId: acme._id,
        fullName: "Acme Editor",
        email: "editor@acme.com",
        passwordHash,
        role: "editor",
      },

      // ==============================
      // Tech Solutions
      // ==============================

      {
        tenantId: tech._id,
        fullName: "Tech Owner",
        email: "owner@tech.com",
        passwordHash,
        role: "owner",
      },
      {
        tenantId: tech._id,
        fullName: "Tech Admin",
        email: "admin@tech.com",
        passwordHash,
        role: "admin",
      },
      {
        tenantId: tech._id,
        fullName: "Tech Viewer",
        email: "viewer@tech.com",
        passwordHash,
        role: "viewer",
      },
      {
        tenantId: tech._id,
        fullName: "Tech Editor",
        email: "editor@tech.com",
        passwordHash,
        role: "editor",
      },
    ]);

    console.log("\n✅ Seed completed successfully!");

    console.log("\nTenants:");
    console.log("--------------------------------");
    console.log(`Acme Corporation : ${acme._id}`);
    console.log(`Tech Solutions   : ${tech._id}`);

    console.log("\nLogin credentials:");
    console.log("--------------------------------");
    console.log("Password: Password123!");

    console.log("\nAcme Corporation:");
    console.log("owner@acme.com");
    console.log("admin@acme.com");
    console.log("viewer@acme.com");
    console.log("editor@acme.com");

    console.log("\nTech Solutions:");
    console.log("owner@tech.com");
    console.log("admin@tech.com");
    console.log("viewer@tech.com");
    console.log("editor@tech.com");

    await mongoose.disconnect();

    console.log("\nMongoDB disconnected.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:");
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
}

seed();