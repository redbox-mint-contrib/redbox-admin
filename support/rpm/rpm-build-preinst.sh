#!/usr/bin/env bash

if [ `whoami` != 'root' ];
        then echo "this script must be executed as root" && exit 1;
fi

ADMIN_INSTALL_HOME="/opt/redbox-admin"

exit_install() {
	if [ $# -gt 0 ]; then
		echo "ERROR: $@." >&2
	fi
	echo "ERROR: rpm pre-install incomplete." >&2
	exit 1
}

log_function() {
 printf  -- "At function: %s...\n" $1
}

stop_server() {
    log_function $FUNCNAME
    ## Added a directory check since in fresh installs, this directory doesn't exist.
    if [ -d ${ADMIN_INSTALL_HOME} ]; then
      service redbox-admin stop
    fi
}

stop_server

