//This also includes dashboard manual control for conveyor, based on timing / this may get changed into something else

//Stepper forward
void stepper_Move() {
  stepper.setSpeed(-300);
  stepper.runSpeed();
  confor = true;
}

//Stepper reverse
void stepper_Rev() {
  stepper.setSpeed(300);
  stepper.runSpeed();
  conrev = true;
}

void stopConveyor() {
  stepper.setSpeed(0);
  confor = false;
  conrev = false;
}
