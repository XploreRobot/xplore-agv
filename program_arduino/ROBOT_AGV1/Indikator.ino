//Indicator method in System Indicator task

void Error_Indikator(){
  if(millis()- now > 0 && millis()- now <200){
    digitalWrite(led,HIGH);
    digitalWrite(buzz,HIGH);
  }
  else if(millis()- now >200 && millis()- now <400){
    digitalWrite(led,LOW);
    digitalWrite(buzz,LOW);
  }
  else if(millis()- now >400){
    now = millis();
  }

}

void Standby_Indikator(){
  if(millis()- now2 >0 && millis()- now2 <1500){
    digitalWrite(led,HIGH);
    digitalWrite(buzz,HIGH);
  }
  else if(millis()- now2 >1500 && millis()- now2 <3000){
    digitalWrite(led,LOW);
    digitalWrite(buzz,LOW);
  }
  else if(millis()- now2 >3000){
    now2 = millis();
    moveTrigger = true;
  }
}

void Normal_Indikator(){
  digitalWrite(led,HIGH);
  digitalWrite(buzz,LOW);
}
