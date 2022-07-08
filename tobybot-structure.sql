START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `guilds` (
  `numId` int(11) NOT NULL,
  `id` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en-US',
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`configuration`)),
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `moderation` (
  `numId` int(11) NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `guildId` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `moderatorId` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updaterId` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updateReason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`logs`)),
  `expires` timestamp NOT NULL DEFAULT current_timestamp(),
  `updateTimestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tobybot` (
  `numId` int(11) NOT NULL,
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`configuration`)),
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `numId` int(11) NOT NULL,
  `id` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`configuration`)),
  `permissionLevel` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE `guilds`
  ADD PRIMARY KEY (`numId`);

ALTER TABLE `moderation`
  ADD PRIMARY KEY (`numId`);

ALTER TABLE `tobybot`
  ADD PRIMARY KEY (`numId`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`numId`);


ALTER TABLE `guilds`
  MODIFY `numId` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `moderation`
  MODIFY `numId` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `tobybot`
  MODIFY `numId` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `numId` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;