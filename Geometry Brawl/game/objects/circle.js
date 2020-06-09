function Circle(x, y, r) {
  var options = {
    friction: 0,
    restitution: .15,
    mass: 2,
    render: {
      fillStyle: '#6C6C6C',
      lineWidth: 10
    }
  }

  this.body = Bodies.circle(x, y, r, options);
  this.r = r;
  this.body.force = { x: 0, y: 0 };
  World.add(world, this.body);
}