-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `name_marathi` VARCHAR(191) NULL DEFAULT '',
    `village` VARCHAR(191) NOT NULL,
    `taluka` VARCHAR(191) NULL DEFAULT '',
    `district` VARCHAR(191) NOT NULL,
    `group_code` VARCHAR(10) NOT NULL,
    `meeting_frequency` VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    `monthly_saving_amount` BIGINT NOT NULL,
    `default_interest_rate` DECIMAL(5, 2) NOT NULL DEFAULT 2.00,
    `default_penalty_amount` BIGINT NOT NULL DEFAULT 0,
    `max_loan_limit` BIGINT NOT NULL DEFAULT 0,
    `max_guarantor_loans` INTEGER NOT NULL DEFAULT 3,
    `subscription_plan` VARCHAR(50) NOT NULL DEFAULT 'FREE',
    `subscription_status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `subscription_expires_at` DATETIME(3) NULL,
    `trial_ends_at` DATETIME(3) NULL,
    `max_members` INTEGER NULL DEFAULT 10,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `logo_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `organizations_group_code_key`(`group_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `name` VARCHAR(191) NOT NULL,
    `name_marathi` VARCHAR(191) NULL DEFAULT '',
    `phone` VARCHAR(15) NOT NULL,
    `email` VARCHAR(255) NULL,
    `password_hash` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `kyc_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `kyc_notes` TEXT NULL,
    `kyc_verified_by` VARCHAR(36) NULL,
    `kyc_verified_at` DATETIME(3) NULL,
    `member_number` INTEGER NOT NULL,
    `joining_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `members_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `members_organization_id_phone_key`(`organization_id`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meetings` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `meeting_date` DATE NOT NULL,
    `month_year` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `opening_balance` BIGINT NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `meetings_organization_id_idx`(`organization_id`),
    INDEX `meetings_status_idx`(`status`),
    INDEX `meetings_month_year_idx`(`month_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meeting_contributions` (
    `id` VARCHAR(36) NOT NULL,
    `meeting_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `savings_amount` BIGINT NOT NULL DEFAULT 0,
    `loan_repayment` BIGINT NOT NULL DEFAULT 0,
    `interest_paid` BIGINT NOT NULL DEFAULT 0,
    `penalty_paid` BIGINT NOT NULL DEFAULT 0,
    `other_amount` BIGINT NOT NULL DEFAULT 0,
    `is_present` BOOLEAN NOT NULL DEFAULT true,

    INDEX `meeting_contributions_meeting_id_idx`(`meeting_id`),
    INDEX `meeting_contributions_member_id_idx`(`member_id`),
    UNIQUE INDEX `meeting_contributions_meeting_id_member_id_key`(`meeting_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meeting_expenses` (
    `id` VARCHAR(36) NOT NULL,
    `meeting_id` VARCHAR(36) NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'MISCELLANEOUS',
    `amount` BIGINT NOT NULL,
    `description` TEXT NULL,

    INDEX `meeting_expenses_meeting_id_idx`(`meeting_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meeting_income` (
    `id` VARCHAR(36) NOT NULL,
    `meeting_id` VARCHAR(36) NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    `amount` BIGINT NOT NULL,
    `description` TEXT NULL,

    INDEX `meeting_income_meeting_id_idx`(`meeting_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loans` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `loan_amount` BIGINT NOT NULL,
    `outstanding_amount` BIGINT NOT NULL,
    `interest_rate` DECIMAL(5, 2) NOT NULL DEFAULT 2.00,
    `disbursed_date` DATE NOT NULL,
    `purpose` TEXT NULL,
    `term_months` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `requested_by` VARCHAR(36) NULL,
    `approved_by` VARCHAR(36) NULL,
    `guarantor_id` VARCHAR(36) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `loans_organization_id_idx`(`organization_id`),
    INDEX `loans_member_id_idx`(`member_id`),
    INDEX `loans_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_emis` (
    `id` VARCHAR(36) NOT NULL,
    `loan_id` VARCHAR(36) NOT NULL,
    `month_year` VARCHAR(7) NOT NULL,
    `due_date` DATE NOT NULL,
    `principal_due` BIGINT NOT NULL,
    `interest_due` BIGINT NOT NULL,
    `principal_paid` BIGINT NOT NULL DEFAULT 0,
    `interest_paid` BIGINT NOT NULL DEFAULT 0,
    `fine_amount` BIGINT NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `paid_at` DATETIME(3) NULL,

    INDEX `loan_emis_loan_id_idx`(`loan_id`),
    INDEX `loan_emis_status_idx`(`status`),
    INDEX `loan_emis_month_year_idx`(`month_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_proofs` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `meeting_id` VARCHAR(36) NULL,
    `amount` BIGINT NOT NULL,
    `upi_reference` VARCHAR(191) NULL,
    `screenshot_url` VARCHAR(191) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `verified_by` VARCHAR(36) NULL,
    `verified_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_proofs_organization_id_idx`(`organization_id`),
    INDEX `payment_proofs_member_id_idx`(`member_id`),
    INDEX `payment_proofs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_organization_id_idx`(`organization_id`),
    INDEX `notifications_member_id_idx`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `performed_by` VARCHAR(36) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(50) NULL DEFAULT '',
    `entity_id` VARCHAR(36) NULL,
    `details` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_organization_id_idx`(`organization_id`),
    INDEX `activity_logs_performed_by_idx`(`performed_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(36) NOT NULL,
    `organization_id` VARCHAR(36) NOT NULL,
    `plan` VARCHAR(50) NOT NULL,
    `amount` BIGINT NOT NULL,
    `max_members` INTEGER NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `phonepe_transaction_id` VARCHAR(191) NULL,
    `phonepe_merchant_transaction_id` VARCHAR(191) NOT NULL,
    `payment_method` VARCHAR(50) NULL,
    `starts_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `subscriptions_phonepe_merchant_transaction_id_key`(`phonepe_merchant_transaction_id`),
    INDEX `subscriptions_organization_id_idx`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_kyc_verified_by_fkey` FOREIGN KEY (`kyc_verified_by`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_contributions` ADD CONSTRAINT `meeting_contributions_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_contributions` ADD CONSTRAINT `meeting_contributions_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_expenses` ADD CONSTRAINT `meeting_expenses_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meeting_income` ADD CONSTRAINT `meeting_income_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_guarantor_id_fkey` FOREIGN KEY (`guarantor_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_emis` ADD CONSTRAINT `loan_emis_loan_id_fkey` FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_proofs` ADD CONSTRAINT `payment_proofs_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_proofs` ADD CONSTRAINT `payment_proofs_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_proofs` ADD CONSTRAINT `payment_proofs_meeting_id_fkey` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_proofs` ADD CONSTRAINT `payment_proofs_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
