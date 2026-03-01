-- CreateTable
CREATE TABLE "ModuleTitle" (
    "module_title_id" SERIAL NOT NULL,
    "module_title" TEXT NOT NULL,
    "module_id" INTEGER NOT NULL,

    CONSTRAINT "ModuleTitle_pkey" PRIMARY KEY ("module_title_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleTitle_module_id_key" ON "ModuleTitle"("module_id");

-- AddForeignKey
ALTER TABLE "ModuleTitle" ADD CONSTRAINT "ModuleTitle_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("module_id") ON DELETE CASCADE ON UPDATE CASCADE;
