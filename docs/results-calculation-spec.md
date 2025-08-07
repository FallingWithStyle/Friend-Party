# Results Calculation Specification

## 1. Overview

This document outlines the algorithm and data structures required to calculate D&D-style stats and classes for each member of a "Friend Party." The calculation is triggered after all party members have completed both their self-assessment and peer-assessment questionnaires.

The process involves three main steps:
1.  **Stat Aggregation**: For each party member, aggregate the numerical values from all answers related to them.
2.  **Stat Calculation**: Convert the aggregated scores into six core D&D-style stats.
3.  **Class Assignment**: Assign a D&D class to the member based on their final calculated stats.

## 2. D&D Stats & Question Mapping

The application will use six core stats. Each question in the `questions` table must be mapped to one of these stats. This mapping will be achieved by adding a `stat_id` column to the `questions` table, which will be a foreign key to a new `stats` table.

### 2.1. Core Stats

| Stat ID | Stat Name | Description |
| :--- | :--- | :--- |
| `STR` | Strength | Represents physical power, assertiveness, and confidence. |
| `DEX` | Dexterity | Represents agility, reflexes, and grace. |
| `CON` | Constitution | Represents endurance, resilience, and toughness. |
| `INT` | Intelligence | Represents logic, knowledge, and analytical skill. |
| `WIS` | Wisdom | Represents intuition, common sense, and awareness. |
| `CHA` | Charisma | Represents social grace, leadership, and charm. |

### 2.2. Answer Values & Data Storage

The calculation process uses two different types of answers, which are stored in the `answers` table.

#### 2.2.1. Self-Assessment Answers
During the self-assessment phase, users select which stats they believe they are good at.
*   **Value**: When a user selects a stat for themselves, an `answer_value` of `1` is stored.
*   **Purpose**: To count how many times a user associates themselves with each stat, which determines their baseline stat ranking.

#### 2.2.2. Peer-Assessment Answers
During the peer-assessment phase, voters select one party member for each question.

*   **Value**: For any given question, the single member chosen by the voter receives `+1` point for the question's associated stat.
*   **All Other Members**: Every other member of the party receives `0` points from that voter for that question.
*   **Purpose**: To adjust baseline stats based on peer selections, where each vote confers a single point to one person.

## 3. Stat Calculation Algorithm

The final stats for each party member are calculated in a two-phase process. First, a baseline is established from self-assessment counts. Second, this baseline is adjusted based on net points from the peer-assessment phase.

### Phase 1: Establish Baseline Stats from Self-Assessment

1.  **Count Self-Selections**: For each user, collect all their self-assessment answers. Group them by the associated `stat_id` and count the number of selections for each of the six stats.
2.  **Rank the Stats**: Order the six stats from the highest selection count to the lowest. In case of a tie, the tie can be broken arbitrarily (e.g., alphabetically by stat ID).
3.  **Assign Standard Array**: Assign a predefined score array to the ranked stats. This creates the user's baseline stat block.
    *   **Highest Ranked Stat**: 13
    *   **2nd Highest**: 12
    *   **3rd Highest**: 11
    *   **4th Highest**: 10
    *   **5th Highest**: 8
    *   **Lowest Ranked Stat**: 6

**Example:**
A user's self-assessment results in the following ranking: 1st: CHA, 2nd: DEX, 3rd: STR, 4th: INT, 5th: WIS, 6th: CON. Their baseline stats would be:
*   `Charisma`: 13
*   `Dexterity`: 12
*   `Strength`: 11
*   `Intelligence`: 10
*   `Wisdom`: 8
*   `Constitution`: 6

### Phase 2: Adjust Stats with Peer Points

After the baseline is set, it is modified by net peer points.

1.  **Calculate Total Peer Points**: For each user and for each stat, sum the points they received from all peer-assessment questions.
    *   A user's score for a single question from a single voter is either:
        *   **+1 point** if they were the one chosen.
        *   **0 points** if they were not chosen.
    *   `Total Peer Points` for a stat is the sum of all points a user accumulates from all voters across all peer-assessment questions associated with that stat.

2.  **Calculate Stat Adjustment**: The impact of peer points is normalized to prevent extreme swings and ensure fairness across parties of different sizes.

    **Formula:**
    `Stat Adjustment = ROUND( (Total Peer Points / (Number of Raters * Number of Questions for Stat)) * 5 )`

    *   `Total Peer Points`: The total score a user received for a stat.
    *   `Number of Raters`: The number of other members in the party who voted.
    *   `Number of Questions for Stat`: The number of peer-assessment questions associated with that stat.
    *   `* 5`: An adjustment factor to control the overall impact of peer ratings.

3.  **Calculate Final Stat Score**:
    `Final Stat Score = Baseline Stat + Stat Adjustment`

## 4. Class Assignment Algorithm

A party member is assigned a class based on their highest final stat score. In the case of a tie, a primary and secondary stat are used to break the tie.

### 4.1. D&D Classes

| Class | Primary Stat | Secondary Stat | Description |
| :--- | :--- | :--- | :--- |
| **Fighter** | Strength | Constitution | A master of martial combat. |
| **Ranger** | Dexterity | Wisdom | A warrior of the wilderness. |
| **Rogue** | Dexterity | Charisma | A scoundrel who uses stealth and trickery. |
| **Monk** | Dexterity | Wisdom | A master of martial arts. |
| **Wizard** | Intelligence | Constitution | A scholarly magic-user. |
| **Cleric** | Wisdom | Charisma | A spiritual warrior. |
| **Druid** | Wisdom | Constitution | A priest of the old faith. |
| **Bard** | Charisma | Dexterity | An inspiring magician whose power echoes the music of creation. |
| **Paladin** | Charisma | Strength | A holy warrior bound to a sacred oath. |
| **Warlock** | Charisma | Constitution | A wielder of magic that is derived from a bargain with an extraplanar entity. |

### Step 1: Identify Highest Stat

Determine the highest `Final Stat Score` for the party member.

### Step 2: Assign Class

*   If there is a single highest stat, assign the corresponding class (e.g., highest stat is `STR` -> `Fighter`).
*   If there is a tie for the highest stat, use the secondary stat defined in the table above to break the tie. For example, if `DEX` and `WIS` are tied for the highest, the class would be `Ranger` because `WIS` is the secondary stat for `Ranger`.

## 5. Database Schema Changes

To support this logic, the following changes are required in the database schema (`init.sql`).

### 5.1. New `stats` Table

A new table is needed to store the core stats.

```sql
CREATE TABLE IF NOT EXISTS public.stats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

INSERT INTO public.stats (id, name) VALUES
('STR', 'Strength'),
('DEX', 'Dexterity'),
('CON', 'Constitution'),
('INT', 'Intelligence'),
('WIS', 'Wisdom'),
('CHA', 'Charisma');
```

### 5.2. Add `stat_id` to `questions` Table

The `questions` table needs a column to link each question to a stat.

```sql
ALTER TABLE public.questions
ADD COLUMN stat_id TEXT REFERENCES public.stats(id);
```

### 5.3. Add Stat and Class Columns to `party_members` Table

The `party_members` table must be updated to store the final calculated results.

```sql
ALTER TABLE public.party_members
ADD COLUMN strength INTEGER,
ADD COLUMN dexterity INTEGER,
ADD COLUMN constitution INTEGER,
ADD COLUMN intelligence INTEGER,
ADD COLUMN wisdom INTEGER,
ADD COLUMN charisma INTEGER,
ADD COLUMN character_class TEXT;