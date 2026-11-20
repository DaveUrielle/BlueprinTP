class Record {
    constructor(name, email, year, course = null) {
        this.name = name;
        this.email = email;
        this.year = year;
        this.course = course;

        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000);

        this.id = timestamp + "" + random.toString().padStart(3, '0');
    }
}

module.exports = { Record };
