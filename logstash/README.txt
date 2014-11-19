INSTALLING LOGSTASH AND ELASTICSEARCH
-------------------------------------

This will eventually be moved to a wiki somewhere but I'm not sure where right now.

For the most part, you can install Logstash and Elasticsearch as per their respective
instructions as follows:

http://logstash.net/docs/1.4.2/tutorials/getting-started-with-logstash

http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/_installing_elasticsearch.html

NUANCES AND CONFIG

Logstash is particular about which version of Elasticsearch is teams up with.
As of this writing, you should use Elasticsearch 1.1.1 with Logstash 1.4.2.
The correct version of Elasticsearch is here: http://www.elasticsearch.org/downloads/1-1-1/

The config for Logstash is in the repo at logstash/logstash-redbox-es.conf. 
You should make the required tweaks to this file (see below) and then start
Elasticsearch with:

cd elasticsearch/install/dir/
./bin/elasticsearch

OR in daemon mode:

./bin/elasticsearch -d

Then you can start logstash

cd path/to/logstash
./bin/logstash -f /path/to/config/logstash/logstash-redbox-es.conf

I don't know of a daemon mode for Logstash so you may need to use nohup or similar.

#Config Changes#

The plan is to find a better way to pass this config to Logstash, but for now, 
you need to edit some hard coded paths.

Mainly just the "path" and "sincedb_path" in each of the input blocks. The sincedb_path
is what Logstash uses to track when it last made an update to it's output 
(in our case, Elasticsearch). Each input needs to have its own sincedb_path file
for Elasticsearch to be able to track updates correctly. If you wish to force
Elasticsearch to re-parse a logfile(s), you need to delete the cooresponding 
sincedb_path files and restart Logstash.
