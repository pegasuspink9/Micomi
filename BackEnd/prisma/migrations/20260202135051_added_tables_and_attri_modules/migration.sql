-- CreateTable
CREATE TABLE "Module" (
    "module_id" SERIAL NOT NULL,
    "module_title" TEXT NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("module_id")
);

-- CreateTable
CREATE TABLE "ModuleContent" (
    "module_content_id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "module_content" TEXT NOT NULL,

    CONSTRAINT "ModuleContent_pkey" PRIMARY KEY ("module_content_id")
);

-- AddForeignKey
ALTER TABLE "ModuleContent" ADD CONSTRAINT "ModuleContent_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("module_id") ON DELETE CASCADE ON UPDATE CASCADE;
