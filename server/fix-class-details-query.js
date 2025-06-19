// Script to fix the class details to properly handle timezones
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Path to the controller file
    const controllerPath = path.join(__dirname, 'src', 'controllers', 'schedule.controller.ts');
    
    // Create a backup of the original file
    const backupPath = `${controllerPath}.backup-timezone`;
    fs.copyFileSync(controllerPath, backupPath);
    console.log(`Backup created at ${backupPath}`);
    
    // Read the controller file
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    // Find and replace the section that gets class details for a specific hour
    const updatedContent = controllerContent.replace(
      // Find the section where schedules are queried by date and time
      /schedule = await prisma\.schedule\.findFirst\(\{\s*where: \{\s*date: \{ equals: currentDate \},\s*time: targetTime,/g,
      // Replace with a version that uses start/end of day comparison instead
      `schedule = await prisma.schedule.findFirst({
        where: {
          date: {
            // Find dates within the same day, regardless of exact time
            gte: new Date(currentDate.setHours(0, 0, 0, 0)),
            lt: new Date(new Date(currentDate).setHours(24, 0, 0, 0))
          },
          time: targetTime,`
    );
    
    // Write the updated controller back to the file
    fs.writeFileSync(controllerPath, updatedContent, 'utf8');
    console.log('Controller updated to handle timezone differences');
    
    // Test the query directly to confirm it works
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayStart = new Date(currentDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date(currentDate).setHours(24, 0, 0, 0));
    
    console.log('Testing the new query with these parameters:');
    console.log(`Start of day: ${dayStart.toISOString()}`);
    console.log(`End of day: ${dayEnd.toISOString()}`);
    console.log(`Target time: 16:00`);
    
    const schedule = await prisma.schedule.findFirst({
      where: {
        date: {
          gte: dayStart,
          lt: dayEnd
        },
        time: '16:00',
      },
      include: {
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
    
    if (schedule) {
      console.log(`Success! Found 4 PM class with updated query! ID: ${schedule.id}`);
      console.log(`Date: ${schedule.date}`);
      console.log(`Participants: ${schedule.bookings.length}`);
    } else {
      console.log('No 4 PM class found with updated query');
    }
    
  } catch (error) {
    console.error('Error fixing controller:', error);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });