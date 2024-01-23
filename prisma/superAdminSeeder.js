const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

// Una volta aggiunta, in package.json la proprietà <<< "prisma": {"seed": "node prisma/superAdminSeeder.js"} >>>, 
// il seeder viene automaticamente eseguito ad ogni <<< npx prisma migrate dev >>> e <<< npx prisma migrate reset >>> e <<< npx prisma db seed >>>
// a meno di specificare il flag <<< --skip-seed >>

async function seedSuperAdmin()
{
    const nameParts = process.env.USER_FOR_SEEDING.split(" ");
    const hashedPsw = await bcrypt.hash(process.env.PSW_FOR_SEEDING, parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const superAdmin = await prisma.user.upsert(
        {
            "where"     :   {   "email"     :   process.env.MAIL_FOR_SEEDING },
            "update"    :   {},
            "create"    :   {
                                "name"      :   nameParts[0],
                                "surname"   :   nameParts[1],
                                "role"      :   process.env.ROLE_FOR_SEEDING,
                                "email"     :   process.env.MAIL_FOR_SEEDING,
                                "password"  :   hashedPsw
                            }
        });
}

seedSuperAdmin()
    .then( async () => await prisma.$disconnect())
    .catch( async (error) =>
        {
            console.error(error);
            await prisma.$disconnect();
            process.exit(1);
        });
