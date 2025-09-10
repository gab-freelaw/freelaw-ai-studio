var actionUrl = '';
var actionSendMail = '';
var processing = false;
var sendingMail = false;
var captchaClick = false; 

var methods = {
    validateFind: function () {
        var nome = jQuery.trim($('#txtName').val());
        var insc = jQuery.trim($('#txtInsc').val());

        if (nome.length > 2 || insc.length > 0) {
            return true;
        }
        else {
            //Informar 3 caracteres do nome ou o número de inscrição
            $.notify({ title: 'Atenção!', message: 'Voc&#234; deve preencher pelo menos tr&#234;s caracteres no campo &quot;Nome&quot; ou preencher o &quot;N&#186; da inscri&#231;&#227;o&quot; para realizar a consulta!', type: messageType.Warning });
            $('#txtName').focus();
            return false;
        }
    },
    fillResult: function (data) {
        $.each(data, function (i) {
            this['rowIndex'] = i + 1;
            $($('#tmplRowResult').render(this)).appendTo($('#divResult'));
        });

        $('.row').click(function () {
            methods.showDetail($(this).find("[name='hdLink']").val());
        });
    },
    showDetail: function (link) {
        $.ajax({
            url: link,
            success: function (result) {
                if (result.Success) {
                    $($('#tmplDetail').render({ 'DetailUrl': result.Data.DetailUrl, 'ActionMail': actionSendMail, 'Mail': result.Data.Mail })).appendTo('body').modal();
                    $('#tabs').tab();

                    /*if (!result.Data.AllowSendMail) {
                        $('#tabs a[href="#contact"], #imgContact, #contact').remove();
                    }
                    else {
                        $('#btnClear').click(function () {
                            $('#frmMail').get(0).reset();
                        });

                        $('#imgContact').click(function () {
                            $('#tabs a:last').tab('show');
                        });

                        $('#btnBack').click(function () {
                            $('#tabs a:first').tab('show');
                        });

                        $('#btnContactSend').click(function () {
                            if (!sendingMail) {
                                methods.sendContact();
                            }
                        });
                    }*/

                    $('.modal').on('hidden', function () {
                        $(this).remove();

                        var backUrl = jQuery.trim($('#hdBackUrl').val());

                        if (backUrl) {
                            location.href = backUrl;
                        }
                    });

                    //Fechar modal
                    $('.modal .close').click(function () {
                        $('.modal').modal('hide');
                    });

                    //Imprimir
                    $('#imgPrint').click(function () {
                        $('#divImgDetail').printThis({
                            title: 'CNA - Cadastro Nacional dos Advogados'
                        });
                    });

                    //Sociedades
                    if (result.Data.Sociedades && result.Data.Sociedades.length > 0) {
                        $('#soci table tbody').append($($('#tpmlSociContent').render(result.Data)));
                    }
                    else {
                        $('#tabs a[href="#soci"], #soci').remove();
                    }

                    /*var overlay = $('<div id="overlay"/>');
                    overlay.height($(document).outerHeight());
                    $('body').append(overlay);
                    $($('#tmplDetail').render(result.Data)).appendTo(overlay);
                    $('#alertModalOuter').center();

                    if (!result.Data.AllowSendMail) {
                        $('#imgContact').remove();
                    }
                    else {
                        $('.divDetail').append($($('#tmplContact').render({ 'action': actionSendMail })));
                        $('#divEmail').find("[name='advMail']").val(result.Data.Mail);

                        $('#imgContact').click(function () {
                            $('.divViewDetail').hide();
                            $('#alertModal').css('height', '+=80px');
                            $('#divEmail').show();
                            $('#txtContactName').focus();
                        });

                        $('#btnBack').click(function () {
                            $('#divEmail').hide();
                            $('#frmMail').get(0).reset();
                            $('#alertModal').css('height', '-=80px');
                            $('.divViewDetail').show();
                        });

                        $('#btnClear').click(function () {
                            $('#frmMail').get(0).reset();
                        });

                        $('#btnContactSend').click(function () {
                            if (!sendingMail) {
                                methods.sendContact();
                            }
                        });
                    }

                    $('#imgPrint').click(function () {
                        methods.print();
                    });

                    $('#alertModalOuter .divClose').click(function () {
                        $(this).unbind('click');
                        overlay.remove();

                        var backUrl = jQuery.trim($('#hdBackUrl').val());

                        if (backUrl) {
                            location.href = backUrl;
                        }
                    });*/
                }
                else {
                    $.notify({ title: 'Erro ao consultar detalhes:', message: result.Message, type: messageType.Error });
                }
            }
        });
    },
    isValidMail: function (address) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        return reg.test(address);
    },
    sendContact: function () {
        if (!jQuery.trim($('#txtContactName').val()) || !jQuery.trim($('#txtContactMail').val()) || !jQuery.trim($('#txtContactSubject').val()) || !jQuery.trim($('#txtContactMessage').val())) {
            $.notify({ title: 'Atenção!', message: 'Voc&#234; deve informar todos os campos abaixo para realizar o contato!', type: messageType.Error });
            return;
        }

        if (!methods.isValidMail($('#txtContactMail').val())) {
            $.notify({ title: 'Atenção!', message: 'O e-mail informado est&#225; em um formato inv&#225;lido!', type: messageType.Error });
            return;
        }

        $('#btnContactSend').showLoading();
        sendingMail = true;

        $.ajax({
            url: $('#frmMail').attr('action'),
            type: $('#frmMail').attr('method'),
            data: $('#frmMail').serialize(),
            success: function (result) {
                if (result.Success) {
                    $('#frmMail').get(0).reset();
                    $.notify({ title: 'Aviso!', message: 'Contato enviado com sucesso!', type: messageType.Success });
                    $('#btnBack').click();
                }
                else {
                    $.notify({ title: 'Erro ao enviar e-mail!', message: result.Message, type: messageType.Error });
                }
            },
            complete: function () {
                $('#btnContactSend').hideLoading();
                sendingMail = false;
            }
        });
    },
    find: function () {
        if (!processing) {
            $('#textResult').html('');
            $('#divResult').html('');
            $('#resultContent').hide();

            if (methods.validateFind()) {
                $('#btnFind').showLoading();
                processing = true;

                $.ajax({
                    url: $('form').attr('action'),
                    type: $('form').attr('method'),
                    data: $('form').serialize(),
                    headers: {
                        'RequestVerificationToken': TOKENHEADERVALUE
                    },
                    success: function (result) {
                        if (result.Success) {
                            if (result.ResultMessage) {
                                $('#textResult').html(result.ResultMessage + '<br />');
                            }

                            methods.fillResult(result.Data);
                            $('#resultContent').show();
                            $('#resultContent').scrollTo();
                        }
                        else {
                            $.notify({ title: 'Erro!', message: result.Message, type: messageType.Error });
                            console.error(result.Error)
                        }
                    },
                    complete: function () {
                        $('#btnFind').hideLoading();
                        processing = false;
                        //grecaptcha.reset();
                    }
                });
            }
            else {
                $('#btnFind').hideLoading();
                //grecaptcha.reset();
            }
        }
    }
};



jQuery(document).ready(function ($) {
    $('#btnFind').click(function (e) {
        if (!processing) {
            if (methods.validateFind()) {
                $('#btnFind').showLoading();
                methods.find();
                //grecaptcha.execute();
            }
        }
    });

    $('form').keypress(function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) { //Enter keycode
            $('#btnFind').click();
            e.preventDefault();
        }
    });

    $(document).keyup(function (e) {
        //ESC
        if (e.keyCode == 27) {
            $('.divClose').click();
        }
    });

    $('.boxText').click(function () {
        $(this).next('.boxTextContent').find('p').toggle(200);

        if ($(this).hasClass('boxTextBlue')) {
            $(this).toggleClass('boxTextBlueExpanded');
        }
        else {
            $(this).toggleClass('boxTextRedExpanded');
        }
    });

    $('#cmbSeccional').prepend($('<option/>').val('').text('Todas')).val('');
    $('#cmbTipoInsc').prepend($('<option/>').val('').text('Todos')).val('');

    $('#txtName').focus();
    $('input[name="IsMobile"]').val(false);
});