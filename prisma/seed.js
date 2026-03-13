import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import dotenv from "dotenv";

const { PrismaClient } = pkg;
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const userId = 3;

const movies = [
  {
    title: "The Matrix",
    Overview: "A computer hacker learns about the true nature of reality.",
    year: 1999,
    genre: ["Action", "Sci-Fi"],
    runTime: 136,
    createdBy: userId,
  },
  {
    title: "Inception",
    Overview:
      "A thief who steals corporate secrets through dream-sharing technology.",
    year: 2010,
    genre: ["Action", "Sci-Fi", "Thriller"],
    runTime: 148,
    createdBy: userId,
  },
  {
    title: "The Dark Knight",
    Overview: "Batman faces the Joker in a battle for Gotham's soul.",
    year: 2008,
    genre: ["Action", "Crime", "Drama"],
    runTime: 152,
    createdBy: userId,
  },
  {
    title: "Pulp Fiction",
    Overview: "The lives of two mob hitmen, a boxer, and others intertwine.",
    year: 1994,
    genre: ["Crime", "Drama"],
    runTime: 154,
    createdBy: userId,
  },
  {
    title: "Interstellar",
    Overview: "A team of explorers travel through a wormhole in space.",
    year: 2014,
    genre: ["Adventure", "Drama", "Sci-Fi"],
    runTime: 169,
    createdBy: userId,
  },
  {
    title: "The Shawshank Redemption",
    Overview: "Two imprisoned men bond over a number of years.",
    year: 1994,
    genre: ["Drama"],
    runTime: 142,
    createdBy: userId,
  },
  {
    title: "Fight Club",
    Overview:
      "An insomniac office worker and a devil-may-care soapmaker form an underground fight club.",
    year: 1999,
    genre: ["Drama"],
    runTime: 139,
    createdBy: userId,
  },
  {
    title: "Forrest Gump",
    Overview:
      "The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man.",
    year: 1994,
    genre: ["Drama", "Romance"],
    runTime: 142,
    createdBy: userId,
  },
  {
    title: "The Godfather",
    Overview:
      "The aging patriarch of an organized crime dynasty transfers control to his son.",
    year: 1972,
    genre: ["Crime", "Drama"],
    runTime: 175,
    createdBy: userId,
  },
  {
    title: "Goodfellas",
    Overview: "The story of Henry Hill and his life in the mob.",
    year: 1990,
    genre: ["Biography", "Crime", "Drama"],
    runTime: 146,
    createdBy: userId,
  },
];

const main = async () => {
  console.log("seeding started...");
  for (const movie of movies) {
    await prisma.movie.create({
      data: movie,
    });
    console.log("movie created: " + movie.title);
  }
  console.log("seeding completed.");
};

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
