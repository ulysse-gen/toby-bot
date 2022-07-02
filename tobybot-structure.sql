SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `guilds` (
  `numId` int(11) NOT NULL,
  `id` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`configuration`)),
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
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
  `configuration` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tobybot` (`numId`, `configuration`, `permissions`) VALUES
(1, '{\"appName\":\"Toby Bot\",\"token\":\"XXXXXXXXX\",\"prefix\":\"$toby.gg$\",\"prefixes\":[\"$toby.gg$\",\"tobybot.\",\"tbb.\",\"tbb!\"],\"communityGuild\":\"947407448799604766\",\"style\":{\"colors\":{\"success\":\"#00FF68\",\"error\":\"#FF654D\",\"warning\":\"#FFD02F\",\"main\":\"#EF2FFF\"}},\"blocked\":{\"users\":{},\"guilds\":{}},\"logging\":{\"commandExecution\":{\"inConsole\":true,\"inChannel\":true,\"channel\":\"992538311900004502\",\"logFailed\":true},\"moderationLogs\":{\"inConsole\":true,\"inChannel\":true,\"channel\":\"992538592972910674\"},\"autoModerationLogs\":{\"inConsole\":true,\"inChannel\":true,\"channel\":\"992538592972910674\"}}}', '{\"users\":{},\"channels\":{},\"roles\":{},\"guilds\":{}}');


ALTER TABLE `guilds`
  ADD PRIMARY KEY (`numId`);

ALTER TABLE `moderation`
  ADD PRIMARY KEY (`numId`);

ALTER TABLE `tobybot`
  ADD PRIMARY KEY (`numId`);


ALTER TABLE `guilds`
  MODIFY `numId` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `moderation`
  MODIFY `numId` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `tobybot`
  MODIFY `numId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
