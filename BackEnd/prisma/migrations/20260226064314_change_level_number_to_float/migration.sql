-- Safe convert Level.level_number
ALTER TABLE "Level" ALTER COLUMN "level_number" SET DATA TYPE DOUBLE PRECISION USING "level_number"::double precision;

-- Safe convert PlayerProgress.current_level
ALTER TABLE "PlayerProgress" ALTER COLUMN "current_level" SET DATA TYPE DOUBLE PRECISION USING "current_level"::double precision;

-- Safe convert BackgroundMapping.levelNumber
ALTER TABLE "BackgroundMapping" ALTER COLUMN "levelNumber" SET DATA TYPE DOUBLE PRECISION USING "levelNumber"::double precision;