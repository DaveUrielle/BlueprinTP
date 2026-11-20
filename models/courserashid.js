
class Course {
    constructor(code, name, maxCapacity, description) {
        this.code = code;
        this.name = name;
        this.maxCapacity = maxCapacity;
        this.enrolledStudents = [];
        this.description = description;
    }
}

module.exports = { Course };
