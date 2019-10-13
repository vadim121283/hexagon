export function calcSize(size) {
        // Размер паралелограмма
        let y = size[1] + size[0] - 1;
        let x = size[2] + size[0] - 1;
        console.log(x, y);
        
        // Координаты параллелограмма q1 q2 r1 r2
        let q2 = (x-1)/2;
        let r2 = (y-1)/2;
        let q1 = -(q2);
        let r1 = -(r2);
        console.log(q1, q2, r1, r2);
        
        return [q1, q2, r1, r2];
}