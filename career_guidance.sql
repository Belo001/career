-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 03, 2025 at 02:50 AM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `career_guidance`
--

-- --------------------------------------------------------

--
-- Table structure for table `admission_periods`
--

CREATE TABLE `admission_periods` (
  `id` int(11) NOT NULL,
  `institute_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','closed','upcoming') DEFAULT 'upcoming',
  `total_applications` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `admission_periods`
--

INSERT INTO `admission_periods` (`id`, `institute_id`, `name`, `start_date`, `end_date`, `status`, `total_applications`, `created_at`) VALUES
(15, 1, '2024-2025 Main Admissions', '2024-01-01', '2025-12-31', 'active', 3, '2025-11-21 18:55:16'),
(16, 1, '2024 Fall Intake', '2024-08-01', '2025-01-31', 'active', 0, '2025-11-21 18:55:16');

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `institute_id` int(11) DEFAULT NULL,
  `admission_period_id` int(11) DEFAULT NULL,
  `preferred_major` varchar(255) DEFAULT NULL,
  `personal_statement` text DEFAULT NULL,
  `status` enum('pending','under_review','accepted','rejected','withdrawn') DEFAULT 'pending',
  `application_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `student_id`, `course_id`, `institute_id`, `admission_period_id`, `preferred_major`, `personal_statement`, `status`, `application_date`, `reviewed_at`, `review_notes`, `documents`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, 15, 'Data Science', 'p[oiugytfvbhjfmeso iefuiewf ewfuieyfe efkewnfyiegfef je', 'pending', '2025-11-21 18:56:36', NULL, NULL, '[]', '2025-11-21 18:56:36', '2025-11-21 18:56:36'),
(2, 7, 2, 1, 15, 'Data Science', 'fgsgrsgergl;SKxASOPdha/oid.hae.fukhewfo/iqewufj/oewifjew/li.fjew/f', 'pending', '2025-11-21 19:54:30', NULL, NULL, '[]', '2025-11-21 19:54:30', '2025-11-21 19:54:30'),
(3, 2, 3, 1, 15, 'marketing', 'mnhgfdreswexrctvybunmknbvcxsdf gmjhbgfvdcxrdcfvgbhnjknhb', 'pending', '2025-11-22 05:01:47', NULL, NULL, '[]', '2025-11-22 05:01:47', '2025-11-22 05:01:47');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `duration_unit` enum('years','semesters','months') DEFAULT 'years',
  `requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`requirements`)),
  `fees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fees`)),
  `intake_capacity` int(11) DEFAULT NULL,
  `application_deadline` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `faculty_id`, `name`, `code`, `description`, `duration`, `duration_unit`, `requirements`, `fees`, `intake_capacity`, `application_deadline`, `is_active`, `created_at`) VALUES
(1, 1, 'Computer Science', 'CS101', 'Computer science program', 4, 'years', '{\"minGrade\": \"B+\", \"requiredSubjects\": [\"Mathematics\"]}', '{\"domestic\": 5500, \"international\": 16000}', 120, NULL, 1, '2025-11-13 09:13:38'),
(2, 1, 'Electrical Engineering', 'EE201', 'Electrical engineering program with focus on power systems and electronics', 4, 'years', '{\"minGrade\": \"B-\", \"requiredSubjects\": [\"Mathematics\", \"Physics\", \"Chemistry\"], \"minGPA\": 2.8, \"entranceExam\": true}', '{\"domestic\": 5500, \"international\": 16000}', 80, NULL, 1, '2025-11-21 05:09:44'),
(3, 2, 'Business Administration', 'BA301', 'Business management and administration program', 3, 'years', '{\"minGrade\": \"C+\", \"requiredSubjects\": [\"Mathematics\", \"English\"], \"minGPA\": 2.5, \"entranceExam\": false}', '{\"domestic\": 4500, \"international\": 12000}', 120, NULL, 1, '2025-11-21 05:09:44'),
(4, 3, 'Mechanical Engineering', 'ME401', 'Mechanical engineering with focus on design and manufacturing', 4, 'years', '{\"minGrade\": \"B-\", \"requiredSubjects\": [\"Mathematics\", \"Physics\"], \"minGPA\": 2.8, \"entranceExam\": true}', '{\"domestic\": 5200, \"international\": 15500}', 60, NULL, 1, '2025-11-21 05:09:44'),
(10, 1, 'Algebra', 'DID1990', 'oi', 1, 'semesters', '{\"minGrade\":\"B\",\"requiredSubjects\":[],\"minGPA\":\"3\",\"entranceExam\":false}', '{\"domestic\":0,\"international\":0}', 25, '2025-11-28', 1, '2025-11-21 07:16:09'),
(27, 23, 'computer science', 'didb1212', '', 4, 'years', '{\"minGrade\":\"C+\",\"requiredSubjects\":[\"mathematics\"],\"minGPA\":2.5,\"entranceExam\":true}', '{\"domestic\":5000,\"international\":10000}', 150, '2025-11-21', 1, '2025-11-21 20:09:56');

-- --------------------------------------------------------

--
-- Table structure for table `faculties`
--

CREATE TABLE `faculties` (
  `id` int(11) NOT NULL,
  `institute_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `dean_name` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `established_year` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `faculties`
--

INSERT INTO `faculties` (`id`, `institute_id`, `name`, `description`, `dean_name`, `contact_email`, `contact_phone`, `established_year`, `created_at`) VALUES
(1, 1, 'Faculty of Engineering', 'Engineering and technology programs', NULL, NULL, NULL, NULL, '2025-11-13 09:13:38'),
(2, 1, 'Faculty of Computer Science', 'Computer science and IT programs', NULL, NULL, NULL, NULL, '2025-11-13 09:13:38'),
(3, 1, 'Faculty of Engineering', 'Leading engineering faculty with state-of-the-art facilities', 'Dr. John Smith', 'engineering@unitech.edu', '+1-555-0124', 1985, '2025-11-21 05:09:44'),
(4, 1, 'Faculty of Computer Science', 'Innovative computer science programs and research', 'Dr. Sarah Johnson', 'cs@unitech.edu', '+1-555-0125', 1995, '2025-11-21 05:09:44'),
(5, 1, 'Faculty of Business Administration', 'Business and management education excellence', 'Dr. Michael Brown', 'business@unitech.edu', '+1-555-0126', 1990, '2025-11-21 05:09:44'),
(6, 1, 'Faculty of Engineering', 'Leading engineering faculty with state-of-the-art facilities', 'Dr. John Smith', 'engineering@unitech.edu', '+1-555-0124', 1985, '2025-11-21 05:11:08'),
(7, 1, 'Faculty of Computer Science', 'Innovative computer science programs and research', 'Dr. Sarah Johnson', 'cs@unitech.edu', '+1-555-0125', 1995, '2025-11-21 05:11:08'),
(8, 1, 'Faculty of Business Administration', 'Business and management education excellence', 'Dr. Michael Brown', 'business@unitech.edu', '+1-555-0126', 1990, '2025-11-21 05:11:08'),
(9, 1, 'Faculty of art', 'oi', 'Mpho Nku', 'art@gmail.com', '+266555555555', 2025, '2025-11-21 07:11:54'),
(10, 5, 'fruits', '', 'Mpho Nku', 'oi@gmail.com', '+266555555558', 2025, '2025-11-21 08:22:22'),
(11, 1, 'Faculty of Engineering', 'Leading engineering faculty with state-of-the-art facilities', 'Dr. John Smith', 'engineering@unitech.edu', '+1-555-0124', 1985, '2025-11-21 16:10:23'),
(12, 1, 'Faculty of Computer Science', 'Innovative computer science programs and research', 'Dr. Sarah Johnson', 'cs@unitech.edu', '+1-555-0125', 1995, '2025-11-21 16:10:23'),
(13, 1, 'Faculty of Business Administration', 'Business and management education excellence', 'Dr. Michael Brown', 'business@unitech.edu', '+1-555-0126', 1990, '2025-11-21 16:10:23'),
(14, 1, 'Faculty of Engineering', 'Leading engineering faculty with state-of-the-art facilities', 'Dr. John Smith', 'engineering@unitech.edu', '+1-555-0124', 1985, '2025-11-21 16:10:58'),
(15, 1, 'Faculty of Computer Science', 'Innovative computer science programs and research', 'Dr. Sarah Johnson', 'cs@unitech.edu', '+1-555-0125', 1995, '2025-11-21 16:10:58'),
(16, 1, 'Faculty of Business Administration', 'Business and management education excellence', 'Dr. Michael Brown', 'business@unitech.edu', '+1-555-0126', 1990, '2025-11-21 16:10:58'),
(17, 1, 'Faculty of Engineering', 'Leading engineering faculty with state-of-the-art facilities', 'Dr. John Smith', 'engineering@unitech.edu', '+1-555-0124', 1985, '2025-11-21 17:21:53'),
(18, 1, 'Faculty of Computer Science', 'Innovative computer science programs and research', 'Dr. Sarah Johnson', 'cs@unitech.edu', '+1-555-0125', 1995, '2025-11-21 17:21:53'),
(19, 1, 'Faculty of Business Administration', 'Business and management education excellence', 'Dr. Michael Brown', 'business@unitech.edu', '+1-555-0126', 1990, '2025-11-21 17:21:53'),
(20, 1, 'Faculty of Engineering', 'Leading engineering faculty with state-of-the-art facilities', 'Dr. John Smith', 'engineering@unitech.edu', '+1-555-0124', 1985, '2025-11-21 17:23:14'),
(21, 1, 'Faculty of Computer Science', 'Innovative computer science programs and research', 'Dr. Sarah Johnson', 'cs@unitech.edu', '+1-555-0125', 1995, '2025-11-21 17:23:14'),
(22, 1, 'Faculty of Business Administration', 'Business and management education excellence', 'Dr. Michael Brown', 'business@unitech.edu', '+1-555-0126', 1990, '2025-11-21 17:23:14'),
(23, 10, 'Faculty of tourists', 'oi', 'Mpho poli', 'botho@gmail.com', '+266555555553', 2025, '2025-11-21 20:05:17');

-- --------------------------------------------------------

--
-- Table structure for table `institutes`
--

CREATE TABLE `institutes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `established_year` int(11) DEFAULT NULL,
  `accreditation` varchar(255) DEFAULT NULL,
  `total_students` int(11) DEFAULT 0,
  `logo_url` varchar(500) DEFAULT NULL,
  `address` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `institutes`
--

INSERT INTO `institutes` (`id`, `user_id`, `name`, `description`, `location`, `contact_email`, `contact_phone`, `website`, `established_year`, `accreditation`, `total_students`, `logo_url`, `address`) VALUES
(1, 3, 'Tech University', 'A leading technological university', 'New York', 'TechUniversity.gmail.com', '+26655555555', NULL, 1985, NULL, 15000, NULL, NULL),
(2, 8, 'Business College', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(5, 18, 'Agric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL),
(10, 29, 'Botho', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `high_school` varchar(255) DEFAULT NULL,
  `graduation_year` int(11) DEFAULT NULL,
  `grades` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`grades`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `user_id`, `date_of_birth`, `phone`, `address`, `high_school`, `graduation_year`, `grades`, `created_at`, `updated_at`) VALUES
(1, 6, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-17 06:42:57', '2025-11-17 06:42:57'),
(2, 7, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-17 06:55:10', '2025-11-17 06:55:10'),
(3, 9, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-21 02:38:55', '2025-11-21 02:38:55'),
(4, 10, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-21 02:46:11', '2025-11-21 02:46:11'),
(5, 11, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-21 03:09:43', '2025-11-21 03:09:43'),
(6, 27, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-21 18:02:12', '2025-11-21 18:02:12'),
(7, 28, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-21 19:52:44', '2025-11-21 19:52:44');

-- --------------------------------------------------------

--
-- Table structure for table `student_institute_applications`
--

CREATE TABLE `student_institute_applications` (
  `id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `institute_id` int(11) DEFAULT NULL,
  `courses_applied` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`courses_applied`)),
  `application_count` int(11) DEFAULT 0,
  `academic_year` year(4) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `student_institute_applications`
--

INSERT INTO `student_institute_applications` (`id`, `student_id`, `institute_id`, `courses_applied`, `application_count`, `academic_year`, `created_at`, `updated_at`) VALUES
(1, 2, 1, '[1,3]', 2, 2025, '2025-11-21 18:56:36', '2025-11-22 05:01:47'),
(2, 7, 1, '[2]', 1, 2025, '2025-11-21 19:54:30', '2025-11-21 19:54:30');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `user_type` enum('student','institute','admin') NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `user_type`, `is_verified`, `verification_token`, `reset_token`, `created_at`, `updated_at`) VALUES
(1, 'System Admin', 'admin@careerguide.com', '0987654321', 'admin', 1, NULL, NULL, '2025-11-13 08:10:01', '2025-11-21 03:40:32'),
(3, 'Tech University', 'tech@university.com', '$2a$10$ivRkYEhVlsJGLyHJMmVbquyfoJfuFQSqmUgR02PI.j/F2eEcZcETi', 'institute', 1, NULL, NULL, '2025-11-13 09:13:38', '2025-11-13 09:13:38'),
(6, 'Test Student', 'student@example.com', '$2a$10$yDkTKP.aU31N8jX8tmXzguSBTVVaAEINva5H9r3k5T8wuynRDPQx.', 'student', 0, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN0dWRlbnRAZXhhbXBsZS5jb20iLCJwdXJwb3NlIjoidmVyaWZpY2F0aW9uIiwiaWF0IjoxNzYzMzYxNzc3LCJleHAiOjE3NjM0NDgxNzd9.kp4NlsJshWGmR-Nxapg_CJzcO4DzgyLO7JkwrYUWtlo', NULL, '2025-11-17 06:42:57', '2025-11-17 06:42:57'),
(7, 'thabo', 'thabo@gmail.com', '$2a$10$Cbls0oMdUuG3M23Jx/CRu.VSBTlueHKWWb12Jrc87RnUYj5ZT5OeW', 'student', 0, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRoYWJvQGdtYWlsLmNvbSIsInB1cnBvc2UiOiJ2ZXJpZmljYXRpb24iLCJpYXQiOjE3NjMzNjI1MTAsImV4cCI6MTc2MzQ0ODkxMH0.j9LRhOg_6VnXv1z1_AnQEmPcr6Va-sMF_awM5uLdlvw', NULL, '2025-11-17 06:55:10', '2025-11-17 06:55:10'),
(8, 'Business College', 'business@gmail.com', '$2a$10$dUpHkxQ9RpuP7Wf007o94eiHCCUtvL4fCZ.TF0LVuEQx3BGxp5uT.', 'institute', 1, NULL, NULL, '2025-11-17 07:10:49', '2025-11-17 07:10:49'),
(9, 'pheku', 'pheku@gmail.com', '$2a$10$3EnmANtUdxrUq4c07w7gIuvUrIgEL1jQnog8/Fagd/Crbhb0zLEOK', 'student', 1, NULL, NULL, '2025-11-21 02:38:55', '2025-11-21 02:38:55'),
(10, 'mpho', 'mpho@gmail.com', '$2a$10$awXRGIY32flcwQvo8nuU1O24Ys5A0QGVTdrfQSBKVziWoH9HoXQN.', 'student', 1, NULL, NULL, '2025-11-21 02:46:11', '2025-11-21 02:46:11'),
(11, 'lebo', 'lebo@gmail.com', '$2a$10$VzQ6ckTuHleILNE4pBIgke.kOD7nNDpsC1rBlSUGkxvFHznSUXyO2', 'student', 1, NULL, NULL, '2025-11-21 03:09:43', '2025-11-21 03:09:43'),
(12, 'New Admin', 'newadmin@careerguide.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, NULL, NULL, '2025-11-21 03:37:22', '2025-11-21 03:37:22'),
(13, 'Test Admin', 'testadmin@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, NULL, NULL, '2025-11-21 03:43:11', '2025-11-21 03:43:11'),
(15, 'University Admin', 'university@edu.com', '$2a$10$3L9hOFvHYDmQrfl.Fpl9beF453spldPRbNtOzIfBOdVUOUs4I9apq', 'institute', 1, NULL, NULL, '2025-11-21 05:09:44', '2025-11-21 05:09:44'),
(18, 'Agric', 'agrico@gmail.com', '$2a$10$EKA3gGN4Lo4zHIQwDFYv4uLgTslity.fue9CuzSjSFEzHg4j5wVaC', 'institute', 1, NULL, NULL, '2025-11-21 07:01:32', '2025-11-21 07:01:32'),
(27, 'tumisang', 'matorokisi@gmail.com', '$2a$10$cAVTfq1uS3XozgaUUDNcte.uXqxWVtTP3T4YOJbthZks7cDU1WfVe', 'student', 1, NULL, NULL, '2025-11-21 18:02:12', '2025-11-21 18:02:12'),
(28, 'Albert', 'albert@gmail.com', '$2a$10$lb0GcUYxzGjTWgmjErvsq.xYaE.VDbOIGL0UOGCUQ935SIaRulj5u', 'student', 1, NULL, NULL, '2025-11-21 19:52:44', '2025-11-21 19:52:44'),
(29, 'Botho', 'botho@gmail.com', '$2a$10$DYV/Sp9LsyOISCThFC2/6etsFnjLjIXVMmyQtU8Ux4kZGNNqujgzC', 'institute', 1, NULL, NULL, '2025-11-21 20:02:32', '2025-11-21 20:02:32');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admission_periods`
--
ALTER TABLE `admission_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admission_periods_institute` (`institute_id`),
  ADD KEY `idx_admission_periods_status` (`status`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_course_period` (`student_id`,`course_id`,`admission_period_id`),
  ADD KEY `institute_id` (`institute_id`),
  ADD KEY `admission_period_id` (`admission_period_id`),
  ADD KEY `idx_applications_status` (`status`),
  ADD KEY `idx_applications_student` (`student_id`),
  ADD KEY `idx_applications_course` (`course_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_courses_faculty` (`faculty_id`);

--
-- Indexes for table `faculties`
--
ALTER TABLE `faculties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `institute_id` (`institute_id`);

--
-- Indexes for table `institutes`
--
ALTER TABLE `institutes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_institute` (`user_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_student` (`user_id`);

--
-- Indexes for table `student_institute_applications`
--
ALTER TABLE `student_institute_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_institute_year` (`student_id`,`institute_id`,`academic_year`),
  ADD KEY `institute_id` (`institute_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_type` (`user_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admission_periods`
--
ALTER TABLE `admission_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `faculties`
--
ALTER TABLE `faculties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `institutes`
--
ALTER TABLE `institutes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `student_institute_applications`
--
ALTER TABLE `student_institute_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admission_periods`
--
ALTER TABLE `admission_periods`
  ADD CONSTRAINT `admission_periods_ibfk_1` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_3` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_4` FOREIGN KEY (`admission_period_id`) REFERENCES `admission_periods` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `faculties`
--
ALTER TABLE `faculties`
  ADD CONSTRAINT `faculties_ibfk_1` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `institutes`
--
ALTER TABLE `institutes`
  ADD CONSTRAINT `institutes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_institute_applications`
--
ALTER TABLE `student_institute_applications`
  ADD CONSTRAINT `student_institute_applications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_institute_applications_ibfk_2` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
