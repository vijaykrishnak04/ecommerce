//empty input validation
function isValidInput(input) {
  return input.trim() !== '';
}

$('.my-input').on('input', function () {
  if (!isValidInput($(this).val())) {
    $(this).addClass('invalid');
  } else {
    $(this).removeClass('invalid');
  }
});

$('.form').on('submit', function (event) {
  var isValidForm = true;
  $(this).find('.my-input').each(function () {
    if (!isValidInput($(this).val())) {
      isValidForm = false;
      $(this).addClass('invalid');
    } else {
      $(this).removeClass('invalid');
    }
  });

  if (!isValidForm) {
    event.preventDefault(); // Prevent form submission
  }
});


//edit profile validation


const form = document.getElementById('form');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  // Full name validation
  const nameInput = document.querySelector('input[name="name"]');
  const nameValue = nameInput.value.trim();

  if (!nameValue) {
    alert('Please enter your name');
    nameInput.focus();
    return;
  }

  // Phone validation
  const phoneInput = document.querySelector('input[name="phone"]');
  const phoneValue = phoneInput.value.trim();

  if (!phoneValue) {
    alert('Please enter your phone number');
    phoneInput.focus();
    return;
  }

  // Address validation
  const housenameInput = document.getElementById('housename');
  const housenameValue = housenameInput.value.trim();

  if (!housenameValue) {
    alert('Please enter your house name');
    housenameInput.focus();
    return;
  }

  const areaInput = document.getElementById('area');
  const areaValue = areaInput.value.trim();

  if (!areaValue) {
    alert('Please enter your area');
    areaInput.focus();
    return;
  }

  const landmarkInput = document.getElementById('landmark');
  const landmarkValue = landmarkInput.value.trim();

  if (!landmarkValue) {
    alert('Please enter your landmark');
    landmarkInput.focus();
    return;
  }

  const districtInput = document.getElementById('district');
  const districtValue = districtInput.value.trim();

  if (!districtValue) {
    alert('Please enter your district');
    districtInput.focus();
    return;
  }

  const stateInput = document.getElementById('state');
  const stateValue = stateInput.value.trim();

  if (!stateValue) {
    alert('Please enter your state');
    stateInput.focus();
    return;
  }

  const postofficeInput = document.getElementById('postoffice');
  const postofficeValue = postofficeInput.value.trim();

  if (!postofficeValue) {
    alert('Please enter your post office');
    postofficeInput.focus();
    return;
  }

  const pinInput = document.getElementById('pin');
  const pinValue = pinInput.value.trim();

  if (!pinValue) {
    alert('Please enter your pin code');
    pinInput.focus();
    return;
  }

  // Submit the form if validation passes
  form.submit();
});
