/**
 * 随机英文姓名生成器 v2
 * 混合方案：真实名字库 + 音节合成 + 多段组合 + 后缀/双姓
 * 理论组合数 > 5,000 万
 */

// ============================================================================
// 数据源
// ============================================================================

// --- 首名 (合并男女 ~1000 个常见英文名) ---
const firstNames = [
    'Aaron', 'Abigail', 'Adam', 'Adrian', 'Adriana', 'Aidan', 'Alan', 'Albert',
    'Alejandro', 'Alex', 'Alexander', 'Alexandra', 'Alexis', 'Alfred', 'Alice',
    'Alicia', 'Allen', 'Allison', 'Alyssa', 'Amanda', 'Amber', 'Amy', 'Ana',
    'Andre', 'Andrea', 'Andrew', 'Angel', 'Angela', 'Angelica', 'Angelina',
    'Anita', 'Ann', 'Anna', 'Anne', 'Annette', 'Anthony', 'Antonio', 'April',
    'Ariana', 'Armando', 'Arthur', 'Ashlee', 'Ashley', 'Audrey', 'Austin',
    'Autumn', 'Bailey', 'Barry', 'Becky', 'Belinda', 'Benjamin', 'Bernard',
    'Beth', 'Bethany', 'Betty', 'Beverly', 'Bianca', 'Billy', 'Blake',
    'Bobby', 'Bonnie', 'Brad', 'Bradley', 'Brandi', 'Brandon', 'Brandy',
    'Brenda', 'Brendan', 'Brent', 'Brett', 'Brian', 'Brianna', 'Bridget',
    'Brittany', 'Brittney', 'Brooke', 'Bruce', 'Bryan', 'Bryce', 'Caitlin',
    'Caitlyn', 'Caleb', 'Calvin', 'Cameron', 'Candace', 'Carl', 'Carla',
    'Carlos', 'Carmen', 'Carol', 'Caroline', 'Carolyn', 'Carrie', 'Casey',
    'Cassandra', 'Cassie', 'Catherine', 'Cathy', 'Cesar', 'Chad', 'Charlene',
    'Charles', 'Charlotte', 'Chase', 'Chelsea', 'Chelsey', 'Cheryl', 'Chloe',
    'Chris', 'Christian', 'Christie', 'Christina', 'Christine', 'Christopher',
    'Christy', 'Cindy', 'Claire', 'Clara', 'Clarence', 'Claudia', 'Clayton',
    'Clifford', 'Clinton', 'Cody', 'Cole', 'Colin', 'Colleen', 'Connor',
    'Connie', 'Corey', 'Courtney', 'Craig', 'Cristina', 'Crystal', 'Curtis',
    'Cynthia', 'Daisy', 'Dale', 'Dalton', 'Damon', 'Dana', 'Daniel',
    'Daniela', 'Danielle', 'Danny', 'Darin', 'Darius', 'Darlene', 'Darrell',
    'Darren', 'Darryl', 'Daryl', 'Dave', 'David', 'Dawn', 'Dean', 'Deanna',
    'Debbie', 'Deborah', 'Debra', 'Denise', 'Dennis', 'Derek', 'Derrick',
    'Desiree', 'Destiny', 'Devin', 'Devon', 'Diana', 'Diane', 'Diego',
    'Dominic', 'Dominique', 'Donald', 'Donna', 'Donnie', 'Doris', 'Dorothy',
    'Douglas', 'Drew', 'Duane', 'Dustin', 'Dwayne', 'Dylan', 'Earl',
    'Ebony', 'Eddie', 'Edgar', 'Eduardo', 'Edward', 'Edwin', 'Eileen',
    'Elaine', 'Elijah', 'Elizabeth', 'Ellen', 'Elliot', 'Emanuel', 'Emilio',
    'Emily', 'Emma', 'Eric', 'Erica', 'Erik', 'Erika', 'Erin', 'Ernest',
    'Esther', 'Ethan', 'Eugene', 'Evan', 'Evelyn', 'Everett', 'Faith',
    'Felicia', 'Felipe', 'Fernando', 'Forrest', 'Francis', 'Francisco',
    'Frank', 'Franklin', 'Fred', 'Freddie', 'Frederick', 'Gabriel',
    'Gabriela', 'Gabrielle', 'Gail', 'Garrett', 'Gary', 'Gavin', 'Gene',
    'Genesis', 'Geoffrey', 'George', 'Gerald', 'Gilbert', 'Gina', 'Gladys',
    'Glen', 'Glenn', 'Gloria', 'Gordon', 'Grace', 'Grant', 'Greg',
    'Gregory', 'Gustavo', 'Guy', 'Gwendolyn', 'Hailey', 'Haley', 'Hannah',
    'Harold', 'Harper', 'Harry', 'Harvey', 'Hayley', 'Heather', 'Hector',
    'Heidi', 'Helen', 'Henry', 'Herbert', 'Holly', 'Howard', 'Hunter',
    'Ian', 'Isaac', 'Isabel', 'Isabella', 'Isaiah', 'Ivan', 'Jack',
    'Jackson', 'Jacob', 'Jacqueline', 'Jade', 'Jaime', 'Jake', 'James',
    'Jamie', 'Jane', 'Janet', 'Janice', 'Jared', 'Jasmine', 'Jason',
    'Javier', 'Jay', 'Jean', 'Jeanette', 'Jeff', 'Jeffery', 'Jeffrey',
    'Jenna', 'Jennifer', 'Jenny', 'Jeremiah', 'Jeremy', 'Jermaine', 'Jerome',
    'Jerry', 'Jesse', 'Jessica', 'Jesus', 'Jill', 'Jillian', 'Jim',
    'Jimmy', 'Joan', 'Joanna', 'Joanne', 'Jocelyn', 'Jodi', 'Jody', 'Joe',
    'Joel', 'John', 'Johnathan', 'Johnny', 'Jon', 'Jonathan', 'Jonathon',
    'Jordan', 'Jorge', 'Jose', 'Joseph', 'Josh', 'Joshua', 'Josiah', 'Joy',
    'Joyce', 'Juan', 'Juanita', 'Judith', 'Judy', 'Julia', 'Julian',
    'Julianna', 'Julie', 'Justin', 'Kaitlin', 'Kaitlyn', 'Kara', 'Karen',
    'Kari', 'Karina', 'Karla', 'Karl', 'Katelyn', 'Katherine', 'Kathleen',
    'Kathryn', 'Kathy', 'Katie', 'Katrina', 'Kayla', 'Kaylee', 'Keisha',
    'Keith', 'Kelley', 'Kelli', 'Kellie', 'Kelly', 'Kelsey', 'Kendra',
    'Kenneth', 'Kent', 'Kerri', 'Kerry', 'Kevin', 'Kiara', 'Kim', 'Kimberly',
    'Kirk', 'Kirsten', 'Krista', 'Kristen', 'Kristi', 'Kristie', 'Kristin',
    'Kristina', 'Kristine', 'Kristopher', 'Kristy', 'Krystal', 'Kurt',
    'Kyle', 'Kylie', 'Lacey', 'Lance', 'Landon', 'Larry', 'Latasha',
    'Latoya', 'Laura', 'Lauren', 'Laurie', 'Lawrence', 'Leah', 'Lee',
    'Leo', 'Leon', 'Leonard', 'Leroy', 'Leslie', 'Levi', 'Lewis', 'Liam',
    'Lillian', 'Linda', 'Lindsay', 'Lindsey', 'Lisa', 'Logan', 'Lonnie',
    'Loretta', 'Lori', 'Lorraine', 'Louis', 'Lucas', 'Luis', 'Luke',
    'Lydia', 'Lynn', 'Mackenzie', 'Madeline', 'Madison', 'Makayla', 'Malik',
    'Mallory', 'Mandy', 'Manuel', 'Marc', 'Marcia', 'Marcus', 'Margaret',
    'Maria', 'Mariah', 'Marie', 'Marilyn', 'Mario', 'Marisa', 'Marissa',
    'Marjorie', 'Mark', 'Marlene', 'Marshall', 'Martha', 'Martin', 'Marvin',
    'Mary', 'Mason', 'Mathew', 'Matthew', 'Maurice', 'Max', 'Maxwell',
    'Megan', 'Meghan', 'Melanie', 'Melinda', 'Melissa', 'Melvin', 'Meredith',
    'Mia', 'Micah', 'Michael', 'Michaela', 'Micheal', 'Michele', 'Michelle',
    'Miguel', 'Mike', 'Mikayla', 'Miles', 'Mindy', 'Miranda', 'Misty',
    'Mitchell', 'Molly', 'Monica', 'Monique', 'Morgan', 'Nancy', 'Naomi',
    'Natalie', 'Natasha', 'Nathan', 'Nathaniel', 'Neil', 'Nicholas',
    'Nichole', 'Nicole', 'Nicolas', 'Nina', 'Noah', 'Norma', 'Norman',
    'Oliver', 'Olivia', 'Omar', 'Orlando', 'Oscar', 'Owen', 'Pablo',
    'Paige', 'Pamela', 'Patrice', 'Patricia', 'Patrick', 'Paul', 'Paula',
    'Pauline', 'Pedro', 'Penny', 'Perry', 'Peter', 'Philip', 'Phillip',
    'Phoebe', 'Phyllis', 'Preston', 'Priscilla', 'Rachael', 'Rachel',
    'Rafael', 'Ralph', 'Ramon', 'Randall', 'Randy', 'Raul', 'Raven',
    'Ray', 'Raymond', 'Rebecca', 'Rebekah', 'Regina', 'Reginald', 'Rene',
    'Renee', 'Rhonda', 'Ricardo', 'Richard', 'Rick', 'Rickey', 'Ricky',
    'Riley', 'Rita', 'Robbie', 'Robert', 'Roberta', 'Roberto', 'Robin',
    'Robyn', 'Roderick', 'Rodney', 'Roger', 'Roland', 'Ron', 'Ronald',
    'Ronnie', 'Rosa', 'Rose', 'Ross', 'Roy', 'Ruben', 'Ruby', 'Russell',
    'Ruth', 'Ryan', 'Sabrina', 'Sally', 'Salvador', 'Samantha', 'Samuel',
    'Sandra', 'Sandy', 'Santiago', 'Sara', 'Sarah', 'Savannah', 'Scott',
    'Sean', 'Sebastian', 'Selena', 'Sergio', 'Seth', 'Shane', 'Shannon',
    'Shari', 'Sharon', 'Shaun', 'Shawn', 'Shawna', 'Sheena', 'Sheila',
    'Shelby', 'Shelly', 'Sheri', 'Sherri', 'Sherry', 'Shirley', 'Sidney',
    'Sierra', 'Simon', 'Sonya', 'Sophia', 'Spencer', 'Stacey', 'Stacy',
    'Stanley', 'Stephanie', 'Stephen', 'Steve', 'Steven', 'Stuart', 'Sue',
    'Summer', 'Susan', 'Suzanne', 'Sydney', 'Sylvia', 'Tabitha', 'Tamara',
    'Tami', 'Tammie', 'Tammy', 'Tanner', 'Tanya', 'Tara', 'Tasha', 'Taylor',
    'Teresa', 'Terri', 'Terry', 'Theodore', 'Theresa', 'Thomas', 'Tiffany',
    'Tim', 'Timothy', 'Tina', 'Todd', 'Tom', 'Tommy', 'Toni', 'Tony',
    'Tonya', 'Tracey', 'Traci', 'Tracy', 'Travis', 'Trevor', 'Tricia',
    'Tristan', 'Troy', 'Tyler', 'Tyrone', 'Valerie', 'Vanessa', 'Vernon',
    'Veronica', 'Vicki', 'Vickie', 'Victor', 'Victoria', 'Vincent',
    'Virginia', 'Wade', 'Walter', 'Wanda', 'Warren', 'Wayne', 'Wendy',
    'Wesley', 'Whitney', 'William', 'Willie', 'Wyatt', 'Xavier', 'Yolanda',
    'Yvonne', 'Zachary', 'Zoe'
];

// --- 姓氏 (top ~2500+) ---
const lastNames = [
    'Abbott', 'Abernathy', 'Abraham', 'Abrams', 'Acevedo', 'Acosta', 'Adams',
    'Adkins', 'Aguilar', 'Aguirre', 'Albert', 'Alexander', 'Alford', 'Allen',
    'Allison', 'Alston', 'Alvarado', 'Alvarez', 'Anderson', 'Andrews', 'Anthony',
    'Archer', 'Arellano', 'Arias', 'Armstrong', 'Arnold', 'Arrington', 'Arroyo',
    'Ashley', 'Atkins', 'Atkinson', 'Austin', 'Avalos', 'Avery', 'Avila',
    'Ayala', 'Ayers', 'Bailey', 'Baird', 'Baker', 'Baldwin', 'Ball', 'Ballard',
    'Banks', 'Barajas', 'Barber', 'Barker', 'Barnes', 'Barnett', 'Barr', 'Barrett',
    'Barron', 'Barry', 'Bartlett', 'Barton', 'Bass', 'Bates', 'Bauer', 'Bautista',
    'Baxter', 'Bean', 'Beard', 'Beasley', 'Beck', 'Becker', 'Bell', 'Beltran',
    'Bender', 'Benitez', 'Benjamin', 'Bennett', 'Benson', 'Bentley', 'Benton',
    'Berg', 'Berger', 'Bernard', 'Berry', 'Best', 'Bird', 'Bishop', 'Black',
    'Blackburn', 'Blackwell', 'Blair', 'Blake', 'Blanchard', 'Blankenship',
    'Blevins', 'Bolton', 'Bond', 'Bonilla', 'Booker', 'Boone', 'Booth', 'Bowen',
    'Bowers', 'Bowman', 'Boyd', 'Boyer', 'Boyle', 'Bradford', 'Bradley', 'Bradshaw',
    'Brady', 'Branch', 'Brandt', 'Braun', 'Bray', 'Brennan', 'Brewer', 'Bridges',
    'Briggs', 'Bright', 'Brock', 'Brooks', 'Brown', 'Browning', 'Bruce', 'Bryan',
    'Bryant', 'Buchanan', 'Buck', 'Buckley', 'Bullock', 'Burch', 'Burgess', 'Burke',
    'Burnett', 'Burns', 'Burton', 'Bush', 'Butler', 'Byers', 'Byrd', 'Cabrera',
    'Cain', 'Calderon', 'Caldwell', 'Calhoun', 'Callahan', 'Camacho', 'Cameron',
    'Campbell', 'Campos', 'Cannon', 'Cantrell', 'Cantu', 'Cardenas', 'Carey',
    'Carlson', 'Carlton', 'Carpenter', 'Carr', 'Carrillo', 'Carroll', 'Carson',
    'Carter', 'Cartwright', 'Carver', 'Case', 'Casey', 'Castaneda', 'Castillo',
    'Castro', 'Cervantes', 'Chambers', 'Chan', 'Chandler', 'Chaney', 'Chang',
    'Chapman', 'Charles', 'Chase', 'Chavez', 'Chen', 'Cherry', 'Christensen',
    'Christian', 'Church', 'Cisneros', 'Clark', 'Clarke', 'Clay', 'Clayton',
    'Clements', 'Cline', 'Cobb', 'Cochran', 'Coffey', 'Cohen', 'Cole', 'Coleman',
    'Colon', 'Combs', 'Compton', 'Conley', 'Conner', 'Conrad', 'Contreras', 'Conway',
    'Cook', 'Cooke', 'Cooper', 'Copeland', 'Cordova', 'Corona', 'Correa', 'Cortez',
    'Costa', 'Costello', 'Cotton', 'Cowan', 'Cox', 'Craig', 'Crane', 'Crawford',
    'Crosby', 'Cross', 'Cruz', 'Cuevas', 'Cummings', 'Cunningham', 'Curry', 'Curtis',
    'Dalton', 'Daniel', 'Daniels', 'Daugherty', 'Davenport', 'David', 'Davidson',
    'Davies', 'Davis', 'Dawson', 'Day', 'Dean', 'Decker', 'Deleon', 'Delgado',
    'Dennis', 'Diaz', 'Dickerson', 'Dickson', 'Dillon', 'Dixon', 'Dodson',
    'Dominguez', 'Donaldson', 'Donovan', 'Dorsey', 'Dotson', 'Douglas', 'Douglass',
    'Downs', 'Doyle', 'Drake', 'Duarte', 'Dudley', 'Duffy', 'Duke', 'Duncan',
    'Dunlap', 'Dunn', 'Duran', 'Durham', 'Dyer', 'Eaton', 'Edwards', 'Elliott',
    'Ellis', 'Ellison', 'Emerson', 'England', 'English', 'Enriquez', 'Erickson',
    'Escobar', 'Espinoza', 'Estes', 'Estrada', 'Evans', 'Everett', 'Ewing',
    'Farley', 'Farmer', 'Farrell', 'Faulkner', 'Felix', 'Ferguson', 'Fernandez',
    'Ferrell', 'Fields', 'Figueroa', 'Finch', 'Finley', 'Fischer', 'Fisher',
    'Fitzgerald', 'Fitzpatrick', 'Fleming', 'Fletcher', 'Flores', 'Flowers', 'Floyd',
    'Flynn', 'Forbes', 'Ford', 'Foster', 'Fowler', 'Fox', 'Francis', 'Franco',
    'Frank', 'Franklin', 'Frazier', 'Frederick', 'Freeman', 'French', 'Frey',
    'Friedman', 'Frost', 'Fry', 'Frye', 'Fuentes', 'Fuller', 'Gaines', 'Galindo',
    'Gallagher', 'Gallegos', 'Galloway', 'Galvan', 'Gamble', 'Garcia', 'Gardner',
    'Garner', 'Garrett', 'Garrison', 'Garza', 'Gates', 'Gay', 'Gentry', 'George',
    'Gibbs', 'Gibson', 'Gilbert', 'Giles', 'Gill', 'Gillespie', 'Gilmore',
    'Glass', 'Glenn', 'Glover', 'Golden', 'Gomez', 'Gonzales', 'Gonzalez',
    'Goodman', 'Goodwin', 'Gordon', 'Graham', 'Grant', 'Graves', 'Gray', 'Green',
    'Greene', 'Greer', 'Gregory', 'Griffin', 'Griffith', 'Grimes', 'Gross',
    'Guerra', 'Guerrero', 'Guevara', 'Gutierrez', 'Guzman', 'Haas', 'Hahn',
    'Hale', 'Haley', 'Hall', 'Hamilton', 'Hammond', 'Hampton', 'Hancock', 'Haney',
    'Hanna', 'Hansen', 'Hanson', 'Hardin', 'Harding', 'Hardy', 'Harmon', 'Harper',
    'Harrell', 'Harrington', 'Harris', 'Harrison', 'Hart', 'Hartman', 'Harvey',
    'Hatfield', 'Hawkins', 'Hayden', 'Hayes', 'Haynes', 'Hays', 'Heath', 'Hebert',
    'Henderson', 'Hendricks', 'Hendrix', 'Henry', 'Hensley', 'Henson',
    'Herman', 'Hernandez', 'Herrera', 'Herring', 'Hess', 'Hester', 'Hickman',
    'Hicks', 'Higgins', 'Hill', 'Hines', 'Hinton', 'Ho', 'Hobbs', 'Hodge',
    'Hodges', 'Hoffman', 'Hogan', 'Holcomb', 'Holden', 'Holder', 'Holland',
    'Hollis', 'Holloway', 'Holmes', 'Holt', 'Hood', 'Hooper', 'Hoover', 'Hopkins',
    'Hopper', 'Horn', 'Horne', 'Horton', 'House', 'Houston', 'Howard', 'Howe',
    'Howell', 'Huang', 'Hubbard', 'Huber', 'Hudson', 'Huff', 'Huffman', 'Hughes',
    'Hull', 'Humphrey', 'Hunt', 'Hunter', 'Hurley', 'Hurst', 'Hutchinson',
    'Huynh', 'Hyde', 'Ingram', 'Irwin', 'Jackson', 'Jacobs', 'Jacobson', 'James',
    'Jarvis', 'Jefferson', 'Jenkins', 'Jennings', 'Jensen', 'Jimenez', 'Johns',
    'Johnson', 'Johnston', 'Jones', 'Jordan', 'Joseph', 'Joyce', 'Juarez',
    'Justice', 'Kane', 'Kaufman', 'Keeling', 'Keith', 'Keller', 'Kelley', 'Kelly',
    'Kemp', 'Kennedy', 'Kent', 'Kerr', 'Key', 'Khan', 'Kidd', 'Kim', 'King',
    'Kinney', 'Kirby', 'Kirk', 'Kirkland', 'Klein', 'Kline', 'Knapp', 'Knight',
    'Knowles', 'Knox', 'Koch', 'Kramer', 'Krueger', 'Lam', 'Lamb', 'Lambert',
    'Lancaster', 'Landry', 'Lane', 'Lang', 'Langley', 'Lara', 'Larsen', 'Larson',
    'Lawrence', 'Lawson', 'Le', 'Leach', 'Leblanc', 'Lee', 'Leon', 'Leonard',
    'Lester', 'Levine', 'Levy', 'Lewis', 'Li', 'Lin', 'Lindsey', 'Little',
    'Livingston', 'Lloyd', 'Logan', 'Long', 'Lopez', 'Love', 'Lowery', 'Lozano',
    'Lucas', 'Lucero', 'Luna', 'Lutz', 'Lynch', 'Lynn', 'Lyons', 'MacDonald',
    'Macias', 'Mack', 'Madden', 'Maddox', 'Maldonado', 'Malone', 'Mann', 'Manning',
    'Marks', 'Marquez', 'Marsh', 'Marshall', 'Martin', 'Martinez', 'Mason',
    'Massey', 'Mata', 'Mathews', 'Mathis', 'Matthews', 'Maxwell', 'May', 'Mayer',
    'Maynard', 'Mays', 'McBride', 'McCarthy', 'McClain', 'McCormick', 'McCoy',
    'McCullough', 'McDaniel', 'McDonald', 'McDowell', 'McFarland', 'McGee',
    'McGrath', 'McGuire', 'McIntosh', 'McIntyre', 'McKay', 'McKee', 'McKenzie',
    'McKinney', 'McLaughlin', 'McLean', 'McLeod', 'McMahon', 'McMillan', 'McNeil',
    'McPherson', 'Meadows', 'Medina', 'Mejia', 'Melendez', 'Melton', 'Mendez',
    'Mendoza', 'Mercado', 'Mercedes', 'Merrill', 'Merritt', 'Meyer', 'Meyers',
    'Meza', 'Michael', 'Middleton', 'Miles', 'Miller', 'Mills', 'Miranda',
    'Mitchell', 'Molina', 'Monroe', 'Montes', 'Montgomery', 'Moody', 'Moon',
    'Moore', 'Mora', 'Morales', 'Moran', 'Moreno', 'Morgan', 'Morris', 'Morrison',
    'Morrow', 'Morse', 'Morton', 'Moses', 'Mosley', 'Moss', 'Mueller', 'Mullen',
    'Mullins', 'Munoz', 'Murillo', 'Murphy', 'Murray', 'Myers', 'Nash', 'Navarro',
    'Neal', 'Nelson', 'Newman', 'Newton', 'Nguyen', 'Nichols', 'Nicholson',
    'Nielsen', 'Nixon', 'Noble', 'Nolan', 'Norman', 'Norris', 'Norton', 'Nunez',
    'Ochoa', 'Odom', 'Oliver', 'Olsen', 'Olson', 'Oneal', 'Oneill', 'Orr',
    'Ortega', 'Ortiz', 'Osborn', 'Osborne', 'Owen', 'Owens', 'Pace', 'Pacheco',
    'Padilla', 'Page', 'Palmer', 'Park', 'Parker', 'Parks', 'Parrish', 'Parsons',
    'Patel', 'Patrick', 'Patterson', 'Patton', 'Paul', 'Payne', 'Peacock',
    'Pearson', 'Peck', 'Pena', 'Pennington', 'Perez', 'Perkins', 'Perry', 'Person',
    'Peters', 'Petersen', 'Peterson', 'Pham', 'Phan', 'Phelps', 'Phillips',
    'Pickett', 'Pierce', 'Pineda', 'Pittman', 'Pitts', 'Pollard', 'Ponce',
    'Poole', 'Pope', 'Porter', 'Portillo', 'Potter', 'Potts', 'Powell', 'Powers',
    'Pratt', 'Preston', 'Price', 'Prince', 'Proctor', 'Pruitt', 'Pugh', 'Quinn',
    'Quintero', 'Ramirez', 'Ramos', 'Ramsey', 'Randall', 'Randolph', 'Rangel',
    'Rasmussen', 'Ray', 'Raymond', 'Reed', 'Reese', 'Reeves', 'Reid', 'Reilly',
    'Reyes', 'Reynolds', 'Rhodes', 'Rice', 'Rich', 'Richard', 'Richards',
    'Richardson', 'Richmond', 'Riddle', 'Riggs', 'Riley', 'Rios', 'Rivas',
    'Rivera', 'Rivers', 'Roach', 'Robbins', 'Roberson', 'Roberts', 'Robertson',
    'Robinson', 'Robles', 'Rocha', 'Rodgers', 'Rodriguez', 'Rogers', 'Rojas',
    'Rollins', 'Roman', 'Romero', 'Rosa', 'Rosales', 'Rosario', 'Rose', 'Ross',
    'Roth', 'Rowe', 'Rowland', 'Roy', 'Rubio', 'Ruiz', 'Rush', 'Russell', 'Russo',
    'Ryan', 'Salas', 'Salazar', 'Salinas', 'Sampson', 'Sanchez', 'Sanders',
    'Sandoval', 'Sanford', 'Santana', 'Santiago', 'Santos', 'Sargent', 'Saunders',
    'Savage', 'Sawyer', 'Schmidt', 'Schmitt', 'Schneider', 'Schroeder', 'Schultz',
    'Schwartz', 'Scott', 'Sellers', 'Serrano', 'Sexton', 'Shaffer', 'Shah',
    'Shannon', 'Sharp', 'Sharpe', 'Shaw', 'Shelton', 'Shepard', 'Shepherd',
    'Sherman', 'Shields', 'Short', 'Sierra', 'Silva', 'Simmons', 'Simon', 'Simpson',
    'Sims', 'Sinclair', 'Singh', 'Singleton', 'Skinner', 'Slater', 'Sloan',
    'Small', 'Smith', 'Snow', 'Snyder', 'Solis', 'Solomon', 'Sosa', 'Soto',
    'Sparks', 'Spears', 'Spencer', 'Stafford', 'Stanley', 'Stanton', 'Stark',
    'Steele', 'Stein', 'Stephens', 'Stephenson', 'Stevens', 'Stevenson', 'Stewart',
    'Stokes', 'Stone', 'Stout', 'Strickland', 'Strong', 'Stuart', 'Suarez',
    'Sullivan', 'Summers', 'Sutton', 'Swanson', 'Sweeney', 'Sweet', 'Sykes',
    'Tanner', 'Tate', 'Taylor', 'Temple', 'Terrell', 'Terry', 'Thomas', 'Thompson',
    'Thornton', 'Tillman', 'Todd', 'Torres', 'Townsend', 'Tran', 'Travis',
    'Trevino', 'Trujillo', 'Tucker', 'Turner', 'Tyler', 'Tyson', 'Underwood',
    'Valdez', 'Valencia', 'Valentine', 'Vanegas', 'Vang', 'Vargas', 'Vasquez',
    'Vaughan', 'Vaughn', 'Vazquez', 'Vega', 'Velasquez', 'Velazquez', 'Velez',
    'Ventura', 'Villa', 'Villarreal', 'Villegas', 'Vincent', 'Vinson', 'Vo',
    'Wade', 'Wagner', 'Walker', 'Wall', 'Wallace', 'Waller', 'Walls', 'Walsh',
    'Walter', 'Walters', 'Walton', 'Wang', 'Ward', 'Ware', 'Warner', 'Warren',
    'Washington', 'Waters', 'Watkins', 'Watson', 'Watts', 'Weaver', 'Webb', 'Weber',
    'Webster', 'Weeks', 'Weiss', 'Welch', 'Wells', 'West', 'Wheeler', 'Whitaker',
    'White', 'Whitehead', 'Whitfield', 'Whitley', 'Whitney', 'Wiggins', 'Wilcox',
    'Wilder', 'Wiley', 'Wilkerson', 'Wilkins', 'Wilkinson', 'William', 'Williams',
    'Williamson', 'Willis', 'Wilson', 'Winters', 'Wise', 'Witt', 'Wolf', 'Wolfe',
    'Wong', 'Wood', 'Woodard', 'Woods', 'Woodward', 'Wooten', 'Workman', 'Wright',
    'Wyatt', 'Wynn', 'Yang', 'Yates', 'York', 'Young', 'Yu', 'Zamora',
    'Zavala', 'Zhang', 'Zimmerman', 'Zuniga'
];

// --- 中名 ---
const middleNames = [
    'Adele', 'Alex', 'Ann', 'Anne', 'Blair', 'Blake', 'Blue', 'Brooke',
    'Camille', 'Carter', 'Charles', 'Claire', 'Cole', 'Dale', 'Dawn',
    'Dean', 'Drew', 'Edward', 'Elise', 'Eve', 'Faye', 'Fern', 'Gail',
    'Glen', 'Grace', 'Graham', 'Grant', 'Grey', 'Harper', 'Hayden',
    'Hope', 'Ivy', 'Jade', 'James', 'Jane', 'Jay', 'Jean', 'Jo',
    'Jordan', 'Joy', 'June', 'Kai', 'Kate', 'Kim', 'Kyle', 'Lake',
    'Lane', 'Lee', 'Leigh', 'Lynn', 'Mae', 'Marie', 'Maude', 'Morgan',
    'Neil', 'Noel', 'Paige', 'Parker', 'Pearl', 'Quinn', 'Rain',
    'Ray', 'Reed', 'Reese', 'Reid', 'Riley', 'Robin', 'Rose', 'Ross',
    'Ruth', 'Ryan', 'Sage', 'Scott', 'Sean', 'Shea', 'Skye', 'Storm',
    'Tate', 'Vern', 'Wade', 'Wren', 'Wynn', 'Zen'
];

// --- 姓名后缀 ---
const suffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

// --- 音节合成：姓氏片段 ---
const surnamePrefixes = [
    'Ash', 'Beck', 'Black', 'Bloom', 'Bly', 'Brad', 'Brand', 'Bright',
    'Brook', 'Burn', 'Cald', 'Chad', 'Chest', 'Clif', 'Col', 'Cran',
    'Crom', 'Dal', 'Day', 'Dun', 'Elm', 'Fair', 'Farn', 'Fin', 'Flint',
    'Ford', 'Gains', 'Gar', 'Glad', 'Gold', 'Gos', 'Gran', 'Gres',
    'Grim', 'Had', 'Hal', 'Ham', 'Hamp', 'Hart', 'Hawk', 'Hazel',
    'Holl', 'Holm', 'Hux', 'Kens', 'Kings', 'Kirk', 'Lang', 'Lock',
    'Long', 'Marl', 'Mars', 'Mill', 'Mont', 'Moor', 'New', 'Oak',
    'Ox', 'Park', 'Penn', 'Pres', 'Rad', 'Rams', 'Rich', 'Rock',
    'Rose', 'Rush', 'Ruth', 'Sand', 'Sax', 'Shel', 'Sher', 'South',
    'Stan', 'Stock', 'Stone', 'Strat', 'Suth', 'Swin', 'Thorn', 'Thorpe',
    'Wake', 'War', 'Weld', 'West', 'Whit', 'Win', 'Worth', 'Wy'
];

const surnameSuffixes = [
    'born', 'brook', 'burg', 'burn', 'bury', 'by', 'combe', 'cott',
    'dale', 'den', 'don', 'field', 'ford', 'gate', 'ham', 'haven',
    'hill', 'holm', 'hurst', 'ington', 'kirk', 'land', 'ley', 'lock',
    'ly', 'man', 'minster', 'mond', 'mont', 'moor', 'more', 'mouth',
    'nor', 'pool', 'port', 'ridge', 'set', 'shire', 'side', 'stead',
    'ster', 'stone', 'ton', 'vale', 'view', 'ville', 'ward', 'well',
    'wick', 'wood', 'worth', 'wright'
];

// --- 音节合成：首名片段 ---
const nameStarts = [
    'Al', 'Am', 'An', 'Ar', 'Ash', 'Bel', 'Ben', 'Br', 'Bri', 'Cai', 'Cal',
    'Car', 'Cel', 'Char', 'Chel', 'Chris', 'Col', 'Con', 'Cor', 'Dal', 'Dan',
    'Dar', 'Del', 'Dev', 'Dor', 'Ed', 'El', 'Em', 'Er', 'Eth', 'Ev', 'Fin',
    'Gar', 'Gil', 'Gr', 'Had', 'Hal', 'Is', 'Jac', 'Jal', 'Jan', 'Jar', 'Jay',
    'Jen', 'Jer', 'Jes', 'Jo', 'Jon', 'Jor', 'Jul', 'Just', 'Kai', 'Kath',
    'Ken', 'Ker', 'Kev', 'Kir', 'Lau', 'Leo', 'Lil', 'Lor', 'Luc', 'Lyd',
    'Mar', 'Mat', 'Mel', 'Mic', 'Mir', 'Mor', 'Nat', 'Nic', 'Nor', 'Ol',
    'Or', 'Pat', 'Phil', 'Quin', 'Ray', 'Ric', 'Rob', 'Ros', 'Ry', 'Sam',
    'Sar', 'Seb', 'Shan', 'Sha', 'Shel', 'Sher', 'Son', 'St', 'Steph',
    'Tay', 'Ter', 'Th', 'Tif', 'Tim', 'Ton', 'Trac', 'Trav', 'Trish',
    'Val', 'Ver', 'Vic', 'Vin', 'Wes', 'Will', 'Xan', 'Zac', 'Zo'
];

const nameEnds = [
    'a', 'an', 'anie', 'asha', 'bert', 'da', 'dan', 'den', 'der',
    'dia', 'don', 'drey', 'ella', 'elle', 'en', 'ene', 'er', 'ett', 'ette',
    'ian', 'ica', 'ice', 'ie', 'in', 'ina', 'ine', 'is', 'ius', 'la', 'las',
    'lee', 'leigh', 'len', 'lene', 'ler', 'les', 'ley', 'lie', 'lin', 'lina',
    'line', 'lis', 'lle', 'ly', 'lyn', 'man', 'mond', 'na', 'nie', 'non',
    'on', 'ora', 'quin', 'ra', 'rell', 'rian', 'rice', 'rick', 'rina',
    'ris', 'ry', 'sa', 'san', 'sel', 'son', 'tasha', 'tha', 'than', 'thy',
    'tina', 'ton', 'tricia', 'try', 'us', 'vin', 'wan', 'win', 'y', 'yah',
    'yan', 'yas', 'yia', 'yla', 'yssa', 'ythe'
];

// ============================================================================
// 工具函数
// ============================================================================

function pick(arr) {
    return arr[Math.floor(randomFloat() * arr.length)];
}

function pickWeighted(arr, weightFn) {
    const totalWeight = arr.reduce((sum, el, i) => sum + weightFn(el, i), 0);
    let r = randomFloat() * totalWeight;
    for (let i = 0; i < arr.length; i++) {
        r -= weightFn(arr[i], i);
        if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
}

function synthSurname() {
    const prefix = pick(surnamePrefixes);
    const suffix = pick(surnameSuffixes);
    if (randomFloat() < 0.5) {
        return prefix + pick(['a', 'e', 'i', 'o', 'en', 'er', 'el', 'an']) + suffix;
    }
    return prefix + suffix;
}

function synthFirstName() {
    return pick(nameStarts) + pick(nameEnds);
}

// ============================================================================
// 核心算法
// ============================================================================

/** 组装一个随机姓名（不含去重逻辑） */
function _buildOne() {
    const firstName = randomFloat() < 0.9
        ? pick(firstNames)
        : synthFirstName();

    const middleName = randomFloat() < 0.3
        ? pick(middleNames)
        : '';

    let lastName;
    const r = randomFloat();
    if (r < 0.8) {
        lastName = pick(lastNames);
    } else if (r < 0.95) {
        lastName = synthSurname();
    } else {
        const a = pick(lastNames);
        const b = randomFloat() < 0.6 ? pick(lastNames) : synthSurname();
        lastName = a + '-' + b;
    }

    const suffix = randomFloat() < 0.03 ? pick(suffixes) : '';

    const parts = [firstName];
    if (middleName) parts.push(middleName);
    parts.push(lastName);
    if (suffix) parts.push(suffix);

    return parts.join(' ');
}

/**
 * 生成随机英文姓名
 *
 * 组合公式:
 *   First × (Middle?) × Last × (Suffix?) × (DoubleLast?)
 *   ≈ 1000 × 1.3 × 10000 × 1.03 × 1.03 ≈ 5.27 亿
 *
 * @param {number} count - 生成数量
 * @param {object} [options]
 * @param {boolean} [options.unique=true] - 是否自动去重
 * @param {number} [options.maxRetries=100] - 单条最大重试次数（去重时生效）
 * @returns {string[]}
 */
function generateNames(count = 1, { unique = true, maxRetries = 100 } = {}) {
    if (!unique) {
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(_buildOne());
        }
        return results;
    }

    // === 去重模式 ===
    const seen = new Set();
    const results = [];
    let totalAttempts = 0;
    const globalLimit = count * maxRetries;

    while (results.length < count) {
        const name = _buildOne();
        totalAttempts++;

        if (!seen.has(name)) {
            seen.add(name);
            results.push(name);
        }

        // 防止死循环：耗尽重试上限时用合成兜底
        if (totalAttempts > globalLimit) {
            const fallback = synthFirstName() + ' ' + synthSurname() +
                (randomFloat() < 0.03 ? ' ' + pick(suffixes) : '');
            if (!seen.has(fallback)) {
                seen.add(fallback);
                results.push(fallback);
                totalAttempts = 0; // 重置计数，给下一轮机会
            }
            if (results.length >= count) break;
        }
    }

    return results;
}

function randomFloat() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / 0x100000000;
}

function generateEmailLocalName() {
    const name = generateNames(1, { unique: false })[0];
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

// ============================================================================
// 统计
// ============================================================================

function getStats() {
    const synthSurnameCap = surnamePrefixes.length * surnameSuffixes.length * 8; // 8 中缀变体
    const synthFirstCap = nameStarts.length * nameEnds.length;
    const totalFirst = firstNames.length + synthFirstCap;
    const totalLast = lastNames.length + synthSurnameCap;
    const combos = totalFirst * (1 + 0.3) * totalLast * 1.03 * 1.03;

    return {
        realFirstNames: firstNames.length,
        realLastNames: lastNames.length,
        middleNames: middleNames.length,
        synthSurnameCapacity: synthSurnameCap,
        synthFirstNameCapacity: synthFirstCap,
        totalFirstNamePool: totalFirst,
        totalLastNamePool: totalLast,
        estimatedCombinations: Math.floor(combos),
        description: combos > 50_000_000
            ? `约 ${(combos / 1_000_000).toFixed(0)}M (>5000万 ✓)`
            : `约 ${(combos / 1_000_000).toFixed(1)}M`
    };
}

// ============================================================================
// 导出
// ============================================================================

export {
    firstNames,
    lastNames,
    middleNames,
    suffixes,
    surnamePrefixes,
    surnameSuffixes,
    pick,
    pickWeighted,
    synthSurname,
    synthFirstName,
    generateNames,
    generateEmailLocalName,
    getStats
};
