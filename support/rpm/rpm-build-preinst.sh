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
    if ! type -t forever > /dev/null; then
      cd ${ADMIN_INSTALL_HOME} || exit_install "failed to change into install directory."
      sudo -Hu redbox forever stop app.js --prod || exit_install "failed to stop server."
    fi
}

stop_server

