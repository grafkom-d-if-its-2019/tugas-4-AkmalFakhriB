(function() {

  glUtils.SL.init({ callback: function() { main(); }});
  function main() {
    var canvas = document.getElementById("glcanvas");
    var gl = glUtils.checkWebGL(canvas);
    var vertexShader = glUtils.getShader(gl, gl.VERTEX_SHADER, glUtils.SL.Shaders.v1.vertex);
    var fragmentShader = glUtils.getShader(gl, gl.FRAGMENT_SHADER, glUtils.SL.Shaders.v1.fragment);
    var program = glUtils.createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Mendefinisikan verteks-verteks
    var vertices = [];
    var cubePoints = [
      [ -0.5, -0.5,  0.5 ],
      [ -0.5,  0.5,  0.5 ],
      [  0.5,  0.5,  0.5 ],
      [  0.5, -0.5,  0.5 ],
      [ -0.5, -0.5, -0.5 ],
      [ -0.5,  0.5, -0.5 ],
      [  0.5,  0.5, -0.5 ],
      [  0.5, -0.5, -0.5 ],
    ];

    var name = [
      [ -0.185, -0.4, 0],
      [ 0.115, 0.35, 0],
      [ 0.185, 0.35, 0],
      [ 0.185, -0.23, 0],
      [ 0.115, -0.1, 0],
      [ 0.115, 0.12, 0],
      [ 0.005, -0.2, 0],
      [ 0.115, -0.2, 0],
      [ 0.115, -0.12, 0],
      [ 0.185, -0.25, 0],
      [ 0.115, -0.38, 0],
      [ 0.115, -0.3, 0],
      [ -0.025, -0.3, 0],
      [ -0.07, -0.4, 0],
    ]

    var cubeColors = [
      [],
      [1.0, 0.0, 0.0], // merah
      [0.0, 1.0, 0.0], // hijau
      [0.0, 0.0, 1.0], // biru
      [1.0, 1.0, 1.0], // putih
      [1.0, 0.5, 0.0], // oranye
      [1.0, 1.0, 0.0], // kuning
      []
    ];
    function quad(a, b, c, d) {
      var indices = [a, b, b, c, c, d, d, a]
      for (var i=0; i < indices.length; i++) {
        for (var j=0; j < 3; j++) {
          vertices.push(cubePoints[indices[i]][j]);
        }
        for (var j=0; j < 3; j++) {
          vertices.push(cubeColors[3][j]);
        }
      }
    }
    function letter(a, b, c, d, e, f ,g, h, i_2 ,j ,k ,l ,m ,n) {
      var indices = [a, b, b, c, c, d, d, e, e, f, f, g, g, h, h, i_2, i_2, j, j, k, k, l, l, m, m, n, n, a]
      for (var i=0; i < indices.length; i++) {
        for (var j=0; j < 3; j++) {
          vertices.push(name[indices[i]][j]);
        }
        for (var j=0; j < 3; j++) {
          vertices.push(cubeColors[1][j]);
        }
      }
    }
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
    quad(6, 5, 1, 2);
    letter(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13);
    

    console.log(vertices.length);
    console.log(vertices);

    // Membuat vertex buffer object (CPU Memory <==> GPU Memory)
    var vertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Membuat sambungan untuk attribute
    var vPosition = gl.getAttribLocation(program, 'vPosition');
    var vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(
      vPosition,    // variabel yang memegang posisi attribute di shader
      3,            // jumlah elemen per atribut
      gl.FLOAT,     // tipe data atribut
      gl.FALSE, 
      6 * Float32Array.BYTES_PER_ELEMENT, // ukuran byte tiap verteks (overall) 
      0                                   // offset dari posisi elemen di array
    );
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, gl.FALSE,
      6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(vPosition);
    gl.enableVertexAttribArray(vColor);

    // Membuat sambungan untuk uniform
    var thetaUniformLocation = gl.getUniformLocation(program, 'theta');
    var theta = 0;
    var thetaSpeed = 0.0;
    var axis = [true, true, true];
    var x = 0;
    var y = 1;
    var z = 2;
    var i_x = 0.0, i_y = 0.0, i_z = 0.0, rot = 0.0;
    var slide_x = 0.01, slide_y = 0.01, slide_z = 0.01, rot_t = 0.05;
    var nameLoc = [], cubePos = [];
    
    var PLANE = {
      FRONT: null,
      BACK: null,
      TOP: null,
      BOTTOM: null,
      RIGHT: null,
      LEFT: null
    }

    // Definisi untuk matriks model
    var mmLoc = gl.getUniformLocation(program, 'modelMatrix');
    var mm = glMatrix.mat4.create();
    glMatrix.mat4.translate(mm, mm, [0.0, 0.0, -2.0]);

    // Definisi untuk matrix view dan projection
    var vmLoc = gl.getUniformLocation(program, 'viewMatrix');
    var vm = glMatrix.mat4.create();
    var pmLoc = gl.getUniformLocation(program, 'projectionMatrix');
    var pm = glMatrix.mat4.create();
    var camera = {x: 0.0, y: 0.0, z:0.0};
    glMatrix.mat4.perspective(pm,
      glMatrix.glMatrix.toRadian(90), // fovy dalam radian
      canvas.width/canvas.height,     // aspect ratio
      0.5,  // near
      10.0, // far  
    );
    gl.uniformMatrix4fv(pmLoc, false, pm);

    var tmp = glMatrix.mat4.create();

    // Kontrol menggunakan keyboard
    function onKeyDown(event) {
      if (event.keyCode == 189) thetaSpeed -= 0.01;       // key '-'
      else if (event.keyCode == 187) thetaSpeed += 0.01;  // key '='
      else if (event.keyCode == 48) thetaSpeed = 0;       // key '0'
      if (event.keyCode == 88) axis[x] = !axis[x];
      if (event.keyCode == 89) axis[y] = !axis[y];
      if (event.keyCode == 90) axis[z] = !axis[z];
      if (event.keyCode == 38) camera.z -= 0.1;
      else if (event.keyCode == 40) camera.z += 0.1;
      if (event.keyCode == 37) camera.x -= 0.1;
      else if (event.keyCode == 39) camera.x += 0.1;
    }
    document.addEventListener('keydown', onKeyDown);

    function distance(point,plane){
      a = glMatrix.vec3.create()
      b = glMatrix.vec3.create()
      n = glMatrix.vec3.create()
      v = glMatrix.vec3.create()
      glMatrix.vec3.subtract(a,plane[1],plane[2])
      glMatrix.vec3.subtract(b,plane[0],plane[2])
      glMatrix.vec3.cross(n,a,b)
      glMatrix.vec3.subtract(v,point,plane[0])
      return Math.abs(glMatrix.vec3.dot(v,n))
    }

    function coll_check(){
      var coll = 0.05
      // front
      for(var i=0; i<nameLoc.length; i++){
        if(distance(nameLoc[i],PLANE.FRONT) < coll){
          slide_z = -0.01
          return
        }
      }
      // back
      for(var i=0; i<nameLoc.length; i++){
        if(distance(nameLoc[i],PLANE.BACK) < coll){
          slide_z = 0.01
          return
        }
      }
      // top
      for(var i=0; i<nameLoc.length; i++){
        if(distance(nameLoc[i],PLANE.TOP) < coll){
          slide_y = -0.01
          return
        }
      }
      // bottom
      for(var i=0; i<nameLoc.length; i++){
        if(distance(nameLoc[i],PLANE.BOTTOM) < coll){
          slide_y = 0.01
          return
        }
      }
      // left
      for(var i=0; i<nameLoc.length; i++){
        if(distance(nameLoc[i],PLANE.LEFT) < coll){
          slide_x = 0.01
          return
        }
      }
      // right
      for(var i=0; i<nameLoc.length; i++){
        if(distance(nameLoc[i],PLANE.RIGHT) < coll){
          slide_x = -0.01
          return
        }
      }
    }

    function matrix_multiply(a,b){
      var matrix = [];
      var k1 = a[0]*b[0] + a[4]*b[1] + a[8]*b[2]  + a[12]*b[3]; matrix.push(k1)
      var k2 = a[1]*b[0] + a[5]*b[1] + a[9]*b[2]  + a[13]*b[3]; matrix.push(k2)
      var k3 = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14]*b[3]; matrix.push(k3)
      var k4 = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15]*b[3]; matrix.push(k4)
      return matrix;
    }

    glMatrix.mat4.copy(tmp, mm)
//------------------------------------------------------- RENDER ------------------------------------------------------
    function render() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      theta += thetaSpeed;
      if (axis[z]) glMatrix.mat4.rotateZ(mm, mm, thetaSpeed);
      if (axis[y]) glMatrix.mat4.rotateY(mm, mm, thetaSpeed);
      if (axis[x]) glMatrix.mat4.rotateX(mm, mm, thetaSpeed);
      gl.uniformMatrix4fv(mmLoc, false, mm);

      glMatrix.mat4.lookAt(vm,
        [camera.x, camera.y, camera.z], // di mana posisi kamera (posisi)
        [0.0, 0.0, -2.0], // ke mana kamera menghadap (vektor)
        [0.0, 1.0, 0.0]  // ke mana arah atas kamera (vektor)
      );
      gl.uniformMatrix4fv(vmLoc, false, vm);

      cubePos = []
      for (let i = 0; i < cubePoints.length; i++) {
        var temp = matrix_multiply(mm, [...cubePoints[i], 1.0])
        cubePos.push(temp)
      }

      PLANE.FRONT  = [cubePos[0], cubePos[2], cubePos[3]]
      PLANE.BACK   = [cubePos[4], cubePos[6], cubePos[7]]
      PLANE.TOP    = [cubePos[1], cubePos[5], cubePos[6]]
      PLANE.BOTTOM = [cubePos[0], cubePos[4], cubePos[7]]
      PLANE.LEFT   = [cubePos[1], cubePos[4], cubePos[5]]
      PLANE.RIGHT  = [cubePos[2], cubePos[6], cubePos[7]]

      gl.drawArrays(gl.LINES, 0, 48);

      glMatrix.mat4.translate(mm, mm, [i_x, i_y, i_z])
      glMatrix.mat4.rotate(mm,mm,rot,[1.0,1.0,1.0])
      gl.uniformMatrix4fv(mmLoc, false, mm)
      gl.drawArrays(gl.LINES, 48, 28);

      var indices = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ]

      nameLoc = []
      for (var i = 0; i < indices.length; i++) {
        var temp = matrix_multiply(mm, [...name[indices[i]], 1.0])
        nameLoc.push(temp)
      }

      glMatrix.mat4.copy(mm, tmp)
      gl.uniformMatrix4fv(mmLoc, false, mm)

      i_x += slide_x
      i_y += slide_y
      i_z += slide_z
      rot += rot_t 

      coll_check()

      requestAnimationFrame(render);
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    render();
  }
})();