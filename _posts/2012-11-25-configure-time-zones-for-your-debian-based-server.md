---
title: Configure time zones for your debian based server
author: Mohit Jain
layout: post
comments: true
categories:  Server
---
Rails always store your dates in UTC in the database (unless you change a different setting). You can configure time zones for your Debian based server just by running this command:

{% highlight ruby %}

  sudo dpkg-reconfigure tzdata
  # for India, select Asia and then select Kolkata

{% endhighlight %}
