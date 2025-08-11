-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateTable
CREATE TABLE "Admin" (
    "admin_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "Map" (
    "map_id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "map_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty_level" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("map_id")
);

-- CreateTable
CREATE TABLE "Level" (
    "level_id" SERIAL NOT NULL,
    "map_id" INTEGER NOT NULL,
    "level_number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "points_reward" INTEGER NOT NULL,
    "is_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "feedback_message" TEXT NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("level_id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "challenge_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "points_reward" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateTable
CREATE TABLE "Enemy" (
    "enemy_id" SERIAL NOT NULL,
    "level_id" INTEGER NOT NULL,
    "enemy_name" TEXT NOT NULL,
    "enemy_description" TEXT NOT NULL,
    "enemy_difficulty" TEXT NOT NULL,
    "enemy_avatar" TEXT NOT NULL,
    "enemy_skills" TEXT NOT NULL,

    CONSTRAINT "Enemy_pkey" PRIMARY KEY ("enemy_id")
);

-- CreateTable
CREATE TABLE "Player" (
    "player_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "skill_level" TEXT NOT NULL DEFAULT 'beginner',
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL,
    "last_active" TIMESTAMP(3) NOT NULL,
    "days_loggedin" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("player_id")
);

-- CreateTable
CREATE TABLE "PlayerProgress" (
    "progress_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "level_id" INTEGER NOT NULL,
    "current_level" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL,

    CONSTRAINT "PlayerProgress_pkey" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "Character" (
    "character_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "character_name" TEXT NOT NULL,
    "avatar_image" TEXT NOT NULL,
    "character_type" TEXT NOT NULL,
    "exp_points" INTEGER NOT NULL,
    "weapon_name" TEXT NOT NULL,
    "weapon_skill" TEXT NOT NULL,
    "is_unlock" BOOLEAN NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("character_id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "leaderboard_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "total_points" INTEGER NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("leaderboard_id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "achievement_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badge_icon" TEXT NOT NULL,
    "points_required" INTEGER NOT NULL,
    "achievement_type" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("achievement_id")
);

-- CreateTable
CREATE TABLE "PlayerAchievement" (
    "player_achievement_id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerAchievement_pkey" PRIMARY KEY ("player_achievement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");

-- CreateIndex
CREATE INDEX "Player_email_idx" ON "Player"("email");

-- CreateIndex
CREATE INDEX "PlayerProgress_player_id_level_id_idx" ON "PlayerProgress"("player_id", "level_id");

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "Map"("map_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enemy" ADD CONSTRAINT "Enemy_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("achievement_id") ON DELETE RESTRICT ON UPDATE CASCADE;
