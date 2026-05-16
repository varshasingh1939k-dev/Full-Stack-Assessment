import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users with account-level roles
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      name: 'Member User',
      email: 'member@example.com',
      password: hashedPassword,
      role: 'MEMBER',
    },
  });

  const testAdmin = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const testMember = await prisma.user.create({
    data: {
      name: 'Member User 2',
      email: 'member2@example.com',
      password: hashedPassword,
      role: 'MEMBER',
    },
  });

  // Create Project (created by admin)
  const project = await prisma.project.create({
    data: {
      name: 'Alpha Project',
      description: 'First sample project for Team Task Manager',
      createdById: adminUser.id,
    },
  });

  // Add Project Members (project-level roles)
  await prisma.projectMember.createMany({
    data: [
      {
        userId: adminUser.id,
        projectId: project.id,
        role: 'ADMIN',
      },
      {
        userId: memberUser.id,
        projectId: project.id,
        role: 'MEMBER',
      },
    ],
  });

  // Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design database schema',
        description: 'Create the initial Prisma schema for the project',
        priority: 'HIGH',
        status: 'DONE',
        projectId: project.id,
        createdById: adminUser.id,
        assignedToId: adminUser.id,
      },
      {
        title: 'Setup Express server',
        description: 'Initialize Node.js and Express with basic middleware',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        projectId: project.id,
        createdById: adminUser.id,
        assignedToId: memberUser.id,
      },
      {
        title: 'Implement Authentication',
        description: 'Add JWT login and register routes',
        priority: 'MEDIUM',
        status: 'TODO',
        projectId: project.id,
        createdById: adminUser.id,
        assignedToId: null,
      },
    ],
  });

  console.log('Database seeded successfully!');
  console.log('---');
  console.log('Seeded accounts:');
  console.log('  admin@example.com    (ADMIN)  - password123');
  console.log('  member@example.com   (MEMBER) - password123');
  console.log('  test@example.com     (ADMIN)  - password123');
  console.log('  member2@example.com  (MEMBER) - password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
