
class Record {
    constructor(name, email, year, course = null) {
        this.name = name;
        this.email = email;
        this.year = year;
        this.course = course;

        const number = Math.floor(1000000 + Math.random() * 9000000);

        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));

        this.id = String(number) + letter;
    }
}

module.exports = { Record };

