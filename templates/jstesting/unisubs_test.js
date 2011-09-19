{% extends "jstesting/base_test.html" %}
{% block testscript %}

function testFormatTime() {
    assertEquals("12.53", unisubs.formatTime(12.53));
    assertEquals("1:00.00", unisubs.formatTime(60));
    assertEquals("1:00.01", unisubs.formatTime(60.01));
    assertEquals("12:02.00", unisubs.formatTime(722));
}

{% endblock %}
