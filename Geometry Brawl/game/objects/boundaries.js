function Boundary(x, y, w, h, a) {
  var options = {
    friction: 0.1,
    restitution: 1,
    angle: a,
    isStatic: true,
    render: {
      fillStyle: 'grey',
      lineWidth: 0
    }
  }
  this.body = Bodies.rectangle(x, y, w, h, options);
  this.w = w;
  this.h = h;
  World.add(world, this.body);
}