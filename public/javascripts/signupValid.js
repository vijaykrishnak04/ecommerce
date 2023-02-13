const form = document.getElementById('form');
const nam = document.getElementById('name');
const phone = document.getElementById('phone');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');

form.addEventListener('submit',(e)=>{
    let flag = 0;
    const nameValue = nam.value.trim();
    const emailValue   = email.value.trim();
    const  phoneValue = phone.value.trim();
    const passwordValue    = password.value.trim();
    const confirmPasswordValue = confirmPassword.value.trim();

    if(nameValue ===""){
        setError(nam,"Field Cannot be empty","nameError");
        flag = 1;
    }else if(!isNaN(Number(nameValue))){
        setError(nam,"Name should only contain alphabets",'nameError');
        flag = 1;
    }else{
        setSuccess(nam,'nameError');
        flag = 0;
    }

    if(emailValue === ""){
        setError(email,"Field Cannot be Empty","emailError")
        flag =1;
    }else if(!emailValidation(emailValue)){
        setError(email,"Enter a valid Email",'emailError')
        flag = 1;
    }else{
        setSuccess(email,'emailError');
        flag =0;   
    }
    if(phoneValue ===""){
        setError(phone,'Field Cannot be empty','phoneError')
        flag =1;
    }else if(phoneValue.toString().length !== 10 || isNaN(Number(phoneValue))){
        setError(phone,'Enter a valid Mobile Number','phoneError')
        flag =1;
    }else{
        setSuccess(phone,'phoneError')
        flag =0
    } 
    if(passwordValue === ""){
        setError(password,'Field Cannot be empty','passwordError')
        flag = 1
    }else if(passwordValue.length < 8){
        setError(password,'Password must atleast 8 characters','passwordError')
        flag = 1
    }else if(passwordValue.length > 14){
        setError(password,'Password length cant exceed 15 characters','passwordError')
        flag = 1
    }else{
        setSuccess(password,'passwordError')
           flag = 0 
    }
    if(confirmPasswordValue !== passwordValue ){
        setError(confirmPassword,'Password do not match','confirmPasswordError')
        flag = 1 
    }else{
        setSuccess(confirmPassword,'confirmPasswordError')
        flag = 0
    }
    if(flag === 1){
        e.preventDefault();
        return 0;
    }else {
        return 0;
    }
})
function setError(element,message,id){
    const inputControl = element.parentElement
    document.getElementById(id).innerHTML = message
    inputControl.classList.add('danger')
    inputControl.classList.remove('success')
}
function setSuccess(element,id){
    const inputControl = element.parentElement
    document.getElementById(id).innerHTML = ""
    inputControl.classList.add('success')
    inputControl.classList.remove('danger')
}
function onlyLetter(string){
    return /^[a-zA-Z]+$/.test(string)
}
function emailValidation(email){
    return String(email)
    .toLowerCase()
    .match(  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
} 