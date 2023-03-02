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



